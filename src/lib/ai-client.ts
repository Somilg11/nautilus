// src/lib/ai-client.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FLOW_SCHEMA } from "./ai-schema";

/* -------------------------------------------------------
   Types
------------------------------------------------------- */
export type AIResponse =
  | { type: "message"; content: string }
  | { type: "diagram"; nodes: any[]; edges: any[]; message?: string }
  | { nodes: any[]; edges: any[] };

/* -------------------------------------------------------
   JSON Extractor (strongest version)
------------------------------------------------------- */
function extractJSON(text: string): string | null {
  if (!text) return null;

  // First try ```json ``` blocks
  const block = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (block?.[1]) return block[1].trim();

  // Fallback: find first { ... }
  const first = text.indexOf("{");
  if (first !== -1) {
    let depth = 0;
    for (let i = first; i < text.length; i++) {
      if (text[i] === "{") depth++;
      if (text[i] === "}") depth--;
      if (depth === 0) return text.slice(first, i + 1).trim();
    }
  }

  // Last fallback
  const lo = text.lastIndexOf("{");
  const lc = text.lastIndexOf("}");
  if (lo !== -1 && lc !== -1 && lc > lo) return text.slice(lo, lc + 1).trim();

  return null;
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
- NO extra text.
- If model adds explanation → wrap JSON inside \`\`\`json\`\`\`.
`;

  /* -------------------------------------------------------
     GEMINI SUPPORT (NEW) ✅
  ------------------------------------------------------- */
  if (model === "gemini") {
    try {
      console.log("⚡ GEMINI REQUEST");

      const apiKey = keys.gemini;
      if (!apiKey) throw new Error("❌ Missing Gemini API Key");

      const genAI = new GoogleGenerativeAI(apiKey);

      const response = await genAI
        .getGenerativeModel({
          model: "gemini-2.0-flash",
        })
        .generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: combinedPrompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        });

      let raw = "";
      try {
        raw = response.response.text();
      } catch {
        raw = JSON.stringify(response.response, null, 2);
      }

      const json = extractJSON(raw) ?? raw;

      return JSON.parse(json);
    } catch (err: any) {
      console.error("❌ GEMINI ERROR:", err);
      throw new Error(`Gemini parsing failed: ${err.message}`);
    }
  }

  /* -------------------------------------------------------
     OPENAI
  ------------------------------------------------------- */
  if (model === "openai") {
    try {
      console.log("⚡ OPENAI REQUEST");

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
      });

      const raw = await res.json();
      const txt = raw?.choices?.[0]?.message?.content ?? "";

      const json = extractJSON(txt) ?? txt;
      return JSON.parse(json);
    } catch (err: any) {
      console.error("❌ OPENAI PARSE ERROR:", err);
      throw new Error(`OpenAI JSON failed: ${err.message}`);
    }
  }

  /* -------------------------------------------------------
     CLAUDE
  ------------------------------------------------------- */
  if (model === "claude") {
    try {
      console.log("⚡ CLAUDE REQUEST");

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
      });

      const raw = await res.json();
      const txt = raw?.content?.[0]?.text ?? raw?.completion ?? "";

      const json = extractJSON(txt) ?? txt;
      return JSON.parse(json);
    } catch (err: any) {
      console.error("❌ CLAUDE ERROR:", err);
      throw new Error(`Claude JSON failed: ${err.message}`);
    }
  }

  /* -------------------------------------------------------
     UNSUPPORTED MODEL
  ------------------------------------------------------- */
  throw new Error("Unsupported model");
}
