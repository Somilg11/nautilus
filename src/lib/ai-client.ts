// src/lib/ai-client.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { FLOW_SCHEMA } from "./ai-schema"

/**
 * Browser-side, bring-your-own-key client for the four supported providers.
 *
 * Nautilus ships with no backend, so requests go straight from the browser to
 * the provider with the key the user pasted into Settings. That is a deliberate
 * trade-off (see docs/SELF_HOSTING.md) — keep keys scoped and disposable.
 */

export type AIProvider = "openai" | "gemini" | "claude" | "groq"

/** Default model per provider. */
export const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: "gpt-4o-mini",
  gemini: "gemini-2.5-flash",
  claude: "claude-opus-5",
  groq: "llama-3.3-70b-versatile",
}

export const PROVIDER_META: Record<
  AIProvider,
  { label: string; keyPrefix: string; keysUrl: string; freeTier: string }
> = {
  openai: {
    label: "OpenAI",
    keyPrefix: "sk-",
    keysUrl: "https://platform.openai.com/api-keys",
    freeTier: "Paid — usage-billed, set a spend limit",
  },
  gemini: {
    label: "Google Gemini",
    keyPrefix: "AIza",
    keysUrl: "https://aistudio.google.com/app/apikey",
    freeTier: "Free tier available",
  },
  claude: {
    label: "Anthropic Claude",
    keyPrefix: "sk-ant",
    keysUrl: "https://console.anthropic.com/settings/keys",
    freeTier: "Paid — usage-billed",
  },
  groq: {
    label: "Groq",
    keyPrefix: "gsk_",
    keysUrl: "https://console.groq.com/keys",
    freeTier: "Free tier available",
  },
}

const REQUEST_TIMEOUT_MS = 90_000
const MAX_OUTPUT_TOKENS = 4000

/** One turn of the conversation as the UI stores it. */
export type ChatTurn = { role: "user" | "ai"; content: string }

export type AIResponse =
  | { type: "message"; content: string }
  | { type: "diagram"; nodes: any[]; edges: any[]; message?: string }

export type DiagramContext = {
  name?: string
  nodes: { id: string; data?: any }[]
  edges: { source: string; target: string; op?: string; path?: string }[]
}

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

/** Compact description of what is on the canvas, so the model can reason about it. */
function describeDiagram(diagram?: DiagramContext): string {
  if (!diagram || diagram.nodes.length === 0) {
    return "The canvas is currently empty."
  }

  const nodes = diagram.nodes
    .slice(0, 60)
    .map((n) => {
      const label = n.data?.label ?? n.id
      const desc = n.data?.description ? ` — ${n.data.description}` : ""
      return `- ${n.id}: ${label}${desc}`
    })
    .join("\n")

  const edges = diagram.edges
    .slice(0, 120)
    .map((e) => `- ${e.source} -> ${e.target}${e.op ? ` [${e.op}${e.path ? ` ${e.path}` : ""}]` : ""}`)
    .join("\n")

  return `Current canvas${diagram.name ? ` ("${diagram.name}")` : ""}:
NODES (${diagram.nodes.length}):
${nodes}
CONNECTIONS (${diagram.edges.length}):
${edges || "- none"}`
}

function systemPrompt(diagram?: DiagramContext) {
  return `You are Nautilus AI, a system-design assistant embedded in an architecture diagramming tool.

You can do three things:
1. Answer questions about system design, trade-offs, scaling, and the diagram the user is currently looking at.
2. Review or critique the current diagram — name concrete weaknesses (single points of failure, missing cache, no queue, unbounded fan-out) and how to fix them.
3. Generate or extend a diagram when asked to design something.

RESPONSE FORMAT — always reply with a single JSON object, nothing else:

For conversation, explanation, review or critique:
{ "type": "message", "content": "Markdown-free plain text. Be specific and concise; use short paragraphs or '-' bullets." }

For a diagram:
{ "type": "diagram", "nodes": [...], "edges": [...], "message": "One or two sentences on the design decisions." }

${FLOW_SCHEMA}

${describeDiagram(diagram)}

Rules:
- Prefer "message" unless the user actually wants a diagram built or changed.
- When the user asks to modify the existing diagram, return the COMPLETE new diagram, not a fragment, and keep existing node ids where the component is unchanged.
- Never invent icon names outside the list above.
- Never wrap the JSON in markdown fences.`
}

/** fetch + a hard timeout, so a hanging provider cannot freeze the UI. */
async function postJSON(url: string, init: RequestInit, signal?: AbortSignal) {
  const res = await fetch(url, {
    ...init,
    signal: signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  let body: any = null
  try {
    body = await res.json()
  } catch {
    // fall through — handled below
  }

  if (!res.ok || body?.error) {
    const detail =
      body?.error?.message ??
      body?.error ??
      body?.message ??
      `HTTP ${res.status} ${res.statusText}`
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail))
  }
  if (!body) throw new Error("Provider returned a non-JSON response")

  return body
}

export type GenerateOptions = {
  provider: AIProvider
  keys: Partial<Record<AIProvider, string>>
  /** Prior conversation, oldest first. The last user message is the request. */
  history: ChatTurn[]
  /** What is on the canvas right now, so the model can reason about it. */
  diagram?: DiagramContext
  modelId?: string
  signal?: AbortSignal
}

/**
 * Send the conversation to the selected provider and parse its reply.
 */
export async function generateFlow({
  provider,
  keys,
  history,
  diagram,
  modelId,
  signal,
}: GenerateOptions): Promise<AIResponse> {
  const key = keys[provider]
  if (!key) throw new Error(`Missing API key for ${PROVIDER_META[provider].label}`)

  const model = modelId ?? DEFAULT_MODELS[provider]
  const system = systemPrompt(diagram)

  // Keep the request small; older turns add little and cost a lot.
  const turns = history.slice(-12)
  let rawText = ""

  if (provider === "openai" || provider === "groq") {
    const url =
      provider === "openai"
        ? "https://api.openai.com/v1/chat/completions"
        : "https://api.groq.com/openai/v1/chat/completions"

    const raw = await postJSON(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            ...turns.map((t) => ({
              role: t.role === "ai" ? "assistant" : "user",
              content: t.content,
            })),
          ],
          temperature: 0.2,
          max_tokens: MAX_OUTPUT_TOKENS,
          response_format: { type: "json_object" },
        }),
      },
      signal
    )
    rawText = raw?.choices?.[0]?.message?.content ?? ""
  }

  else if (provider === "gemini") {
    const raw = await postJSON(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Header auth keeps the key out of the URL (and out of logs/referrers).
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: turns.map((t) => ({
            role: t.role === "ai" ? "model" : "user",
            parts: [{ text: t.content }],
          })),
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
          },
        }),
      },
      signal
    )
    rawText =
      raw?.candidates?.[0]?.content?.parts?.[0]?.text ??
      raw?.candidates?.[0]?.content?.[0]?.text ??
      ""
  }

  else if (provider === "claude") {
    const raw = await postJSON(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          // Required for calls made directly from a browser; without it the
          // request is rejected by CORS before it reaches the API.
          "anthropic-dangerous-direct-browser-access": "true",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: MAX_OUTPUT_TOKENS,
          system,
          messages: turns.map((t) => ({
            role: t.role === "ai" ? "assistant" : "user",
            content: t.content,
          })),
        }),
      },
      signal
    )
    rawText = raw?.content?.find((b: any) => b.type === "text")?.text ?? ""
  }

  else {
    throw new Error(`Unknown provider "${provider}"`)
  }

  if (!rawText) throw new Error("Empty response from AI provider")

  const jsonText = extractJSON(rawText) || rawText
  try {
    const parsed = JSON.parse(jsonText)
    if (parsed?.type === "diagram" || (parsed?.nodes && parsed?.edges)) {
      return { type: "diagram", ...parsed }
    }
    if (typeof parsed?.content === "string") {
      return { type: "message", content: parsed.content }
    }
    return { type: "message", content: rawText }
  } catch {
    // The model replied in prose — surface it as a chat message rather than
    // failing the whole request.
    return { type: "message", content: rawText }
  }
}

/**
 * Cheap round-trip used by the "Test key" button in Settings.
 * Resolves on success, throws with the provider's message on failure.
 */
export async function testProviderKey(
  provider: AIProvider,
  key: string,
  modelId?: string,
  signal?: AbortSignal
): Promise<void> {
  if (!key.trim()) throw new Error("No key entered")

  await generateFlow({
    provider,
    keys: { [provider]: key } as Partial<Record<AIProvider, string>>,
    history: [{ role: "user", content: "Reply with the single word: ok" }],
    modelId,
    signal,
  })
}
