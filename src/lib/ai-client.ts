// src/lib/ai-client.ts
import { GoogleGenerativeAI } from "@google/generative-ai"
import { FLOW_SCHEMA } from "./ai-schema"

/* -------------------------------------------------------
   JSON Extractor
------------------------------------------------------- */
function extractJSON(text: string): string | null {
  if (!text) return null

  const block = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (block?.[1]) return block[1].trim()

  const first = text.indexOf("{")
  if (first !== -1) {
    let depth = 0
    for (let i = first; i < text.length; i++) {
      if (text[i] === "{") depth++
      if (text[i] === "}") depth--
      if (depth === 0) return text.slice(first, i + 1).trim()
    }
  }

  const lo = text.lastIndexOf("{")
  const lc = text.lastIndexOf("}")
  if (lo !== -1 && lc !== -1 && lc > lo) return text.slice(lo, lc + 1).trim()

  return null
}

/* -------------------------------------------------------
   Unified Flow Generator
------------------------------------------------------- */
export async function generateFlow(
  prompt: string,
  model: string,
  keys: Record<string, string>
) {
  const combinedPrompt = `
You are an AI system architect.

Convert this request into STRICT JSON ONLY.

${prompt}

${FLOW_SCHEMA}

RULES:
- Return ONLY JSON.
- JSON MUST include: { "nodes": [], "edges": [] }
- No explanation text.
- If explanation exists, wrap output in \`\`\`json code block\`\`\`.
`

  /* -------------------------------------------------------
     GEMINI (SDK VERSION — NO URL) ✅
  ------------------------------------------------------- */
  if (model === "gemini") {
    if (!keys.gemini) throw new Error("Missing Gemini API key")

    console.log("⚡ Using Gemini SDK")

    const genAI = new GoogleGenerativeAI(keys.gemini)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json"
      }
    })

    const result = await model.generateContent(combinedPrompt)
    const rawText = result.response.text()
    console.log("🔥 RAW GEMINI TEXT:", rawText)

    const json = extractJSON(rawText) ?? rawText

    try {
      return JSON.parse(json)
    } catch (err) {
      console.error("❌ Gemini JSON Error:", err)
      console.error("RAW:", rawText)
      throw new Error("Invalid JSON from Gemini")
    }
  }

  /* -------------------------------------------------------
     OPENAI
  ------------------------------------------------------- */
  if (model === "openai") {
    console.log("⚡ OPENAI REQUEST")

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${keys.openai}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: combinedPrompt }],
        response_format: { type: "json_object" },
      }),
    })

    const raw = await res.json()
    const txt = raw?.choices?.[0]?.message?.content ?? ""

    const json = extractJSON(txt) ?? txt

    try {
      return JSON.parse(json)
    } catch (err) {
      console.error("❌ OPENAI PARSE ERROR:", err)
      console.error("RAW:", txt)
      throw new Error("Invalid JSON from OpenAI")
    }
  }

  /* -------------------------------------------------------
     CLAUDE
  ------------------------------------------------------- */
  if (model === "claude") {
    console.log("⚡ CLAUDE REQUEST")

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": keys.claude,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        messages: [{ role: "user", content: combinedPrompt }],
        temperature: 0,
      }),
    })

    const raw = await res.json()
    const txt = raw?.content?.[0]?.text ?? raw?.completion ?? ""

    const json = extractJSON(txt) ?? txt

    try {
      return JSON.parse(json)
    } catch (err) {
      console.error("❌ CLAUDE ERROR:", err)
      throw new Error("Invalid JSON from Claude")
    }
  }

  throw new Error("Unsupported model")
}
