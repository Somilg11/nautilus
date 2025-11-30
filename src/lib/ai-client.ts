// src/lib/ai-client.ts
import { FLOW_SCHEMA } from "./ai-schema"

/**
 * Try to extract a JSON substring from a text blob.
 */
function extractJSON(text: string): string | null {
  if (!text) return null

  // 1) code fence with json
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim()
  }

  // 2) find first balanced JSON object
  const firstBrace = text.indexOf("{")
  if (firstBrace !== -1) {
    let depth = 0
    for (let i = firstBrace; i < text.length; i++) {
      const ch = text[i]
      if (ch === "{") depth++
      else if (ch === "}") {
        depth--
        if (depth === 0) {
          return text.slice(firstBrace, i + 1).trim()
        }
      }
    }
  }

  // 3) fallback: try to find the last {...} block
  const lastOpen = text.lastIndexOf("{")
  const lastClose = text.lastIndexOf("}")
  if (lastOpen !== -1 && lastClose !== -1 && lastClose > lastOpen) {
    return text.slice(lastOpen, lastClose + 1).trim()
  }

  return null
}

export type AIResponse =
  | { type: "message"; content: string }
  | { type: "diagram"; nodes: any[]; edges: any[]; message?: string }

/** unified generator: attempts to parse model outputs robustly */
export async function generateFlow(prompt: string, model: string, keys: Record<string, string>): Promise<AIResponse> {
  const combinedPrompt = `
You are an AI system architect and assistant for Nautilus.
User Request: "${prompt}"

INSTRUCTIONS:
1. If the user is just greeting you or asking a general question (e.g., "Hi", "How are you", "What is this?"), reply with a friendly message.
   JSON Format: { "type": "message", "content": "Your reply here..." }

2. If the user asks to design a system, architecture, or diagram (e.g., "Design Uber", "Microservices app"), generate the diagram.
   JSON Format: { "type": "diagram", "nodes": [...], "edges": [...], "message": "Optional explanation..." }

${FLOW_SCHEMA}

IMPORTANT: Reply with ONLY the JSON object. Do not include markdown formatting outside the JSON.
`

  let rawText = ""

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
        temperature: 0.2,
        max_tokens: 2000,
      }),
    })

    const raw = await res.json()
    if (raw.error) throw new Error(raw.error.message)
    rawText = raw?.choices?.[0]?.message?.content ?? ""
  }

  else if (model === "gemini") {
    const apiKey = keys.gemini
    if (!apiKey) throw new Error("Missing Gemini key")

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: combinedPrompt }] }],
        }),
      }
    )

    const raw = await res.json()
    if (raw.error) throw new Error(raw.error.message)

    rawText =
      raw?.candidates?.[0]?.content?.parts?.[0]?.text ??
      raw?.candidates?.[0]?.content?.[0]?.text ??
      ""
  }

  else if (model === "claude") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": keys.claude,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 2000,
        messages: [{ role: "user", content: combinedPrompt }],
      }),
    })
    const raw = await res.json()
    if (raw.error) throw new Error(raw.error.message)
    rawText = raw?.content?.[0]?.text ?? ""
  }

  else if (model === "groq") {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${keys.groq}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: combinedPrompt }],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    })
    const raw = await res.json()
    if (raw.error) throw new Error(raw.error.message)
    rawText = raw?.choices?.[0]?.message?.content ?? ""
  }

  if (!rawText) throw new Error("Empty response from AI provider")

  const jsonText = extractJSON(rawText) || rawText
  try {
    const parsed = JSON.parse(jsonText)
    return parsed
  } catch (err) {
    console.error("JSON parse failed:", rawText)
    // Fallback: treat as message if parsing fails but text exists
    return { type: "message", content: rawText }
  }
}
