// src/lib/ai-client.ts
import { FLOW_SCHEMA } from "./ai-schema"

/**
 * Try to extract a JSON substring from a text blob.
 * Strategies:
 *  - Look for a JSON code fence ```json ... ```
 *  - Look for the first {...} balanced block
 *  - Look for the last {...} balanced block
 */
function extractJSON(text: string): string | null {
  if (!text) return null

  // 1) code fence with json
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim()
  }

  // 2) find first balanced JSON object (naive but effective)
  const firstBrace = text.indexOf("{")
  if (firstBrace !== -1) {
    // attempt to find matching closing brace by scanning
    let depth = 0
    for (let i = firstBrace; i < text.length; i++) {
      const ch = text[i]
      if (ch === "{") depth++
      else if (ch === "}") {
        depth--
        if (depth === 0) {
          const candidate = text.slice(firstBrace, i + 1)
          return candidate.trim()
        }
      }
    }
  }

  // 3) fallback: try to find the last {...} block
  const lastOpen = text.lastIndexOf("{")
  const lastClose = text.lastIndexOf("}")
  if (lastOpen !== -1 && lastClose !== -1 && lastClose > lastOpen) {
    const candidate = text.slice(lastOpen, lastClose + 1)
    return candidate.trim()
  }

  return null
}

/** unified generator: attempts to parse model outputs robustly */
export async function generateFlow(prompt: string, model: string, keys: Record<string, string>) {
  const combinedPrompt = `
You are an AI system architect. Convert the following request into a system diagram JSON.

${prompt}

${FLOW_SCHEMA}

IMPORTANT: Reply with only the JSON object and nothing else. If you include any text, put the JSON inside a \`\`\`json code block\`\`\`.
`

  if (model === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${keys.openai}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: combinedPrompt }],
        temperature: 0,
        max_tokens: 2000,
      }),
    })

    const raw = await res.json()
    console.log("OpenAI raw:", raw)
    const txt = raw?.choices?.[0]?.message?.content ?? raw?.choices?.[0]?.text
    if (!txt) throw new Error("Empty OpenAI response")
    const jsonText = extractJSON(txt) || txt
    try {
      return JSON.parse(jsonText)
    } catch (err) {
      console.error("OpenAI JSON parse failed, raw text:", txt)
      throw new Error("Failed to parse JSON from OpenAI response")
    }
  }

  if (model === "gemini") {
  const apiKey = keys.gemini
  if (!apiKey) throw new Error("Missing Gemini key")

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: combinedPrompt }],
          },
        ],
      }),
    }
  )

  const raw = await res.json()
  console.log("Gemini raw:", raw)

  const rawText =
    raw?.candidates?.[0]?.content?.parts?.[0]?.text ??
    raw?.candidates?.[0]?.content?.[0]?.text ??
    raw?.candidates?.[0]?.content ??
    ""

  const jsonText = extractJSON(rawText) || rawText

  try {
    const parsed = JSON.parse(jsonText)

    // schema validation
    if (!parsed.nodes || !parsed.edges) {
      throw new Error("Missing nodes/edges")
    }

    return parsed
  } catch (err) {
    console.error("Gemini JSON parse failed:", rawText)
    throw new Error("Failed to parse JSON from Gemini")
  }
}


  if (model === "claude") {
    // Anthropic example — adapt to your API response shape
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": keys.claude,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        messages: [{ role: "user", content: combinedPrompt }],
      }),
    })
    const raw = await res.json()
    console.log("Claude raw:", raw)
    const txt = raw?.completion ?? raw?.result ?? raw?.response ?? raw?.messages?.[0]?.content?.[0]?.text
    if (!txt) throw new Error("Empty Claude response")
    const jsonText = extractJSON(txt) || txt
    try {
      return JSON.parse(jsonText)
    } catch (err) {
      console.error("Claude JSON parse failed, raw text:", txt)
      throw new Error("Failed to parse JSON from Claude response")
    }
  }

  if (model === "groq") {
    // Placeholder — adapt to Groq's response format if/when you integrate
    throw new Error("Groq integration not implemented in this helper")
  }

  throw new Error("Unsupported model")
}
