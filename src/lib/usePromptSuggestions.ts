// src/lib/usePromptSuggestions.ts
"use client"

import { useState, useEffect, useRef } from "react"
import { GoogleGenerativeAI } from "@google/generative-ai"

export function usePromptSuggestions(prompt: string) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [visible, setVisible] = useState(false)
  const lastValue = useRef("")

  useEffect(() => {
    // 🛑 1. When deleting / backspacing → DO NOT show suggestions
    if (prompt.length < lastValue.current.length) {
      lastValue.current = prompt
      setSuggestions([])
      setVisible(false)
      return
    }

    lastValue.current = prompt

    // 🛑 2. Do not show suggestions for small input
    if (!prompt || prompt.length < 4) {
      setSuggestions([])
      setVisible(false)
      return
    }

    const timeout = setTimeout(async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_KEY
        if (!apiKey) return

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const result = await model.generateContent(
            `Give exactly 4 very short crisp architecture ideas 6 to 8 words related to "${prompt}". 
             No extra text, no bullet numbers, no sentences.`
          )

        const text = result.response.text() ?? ""

        const arr = text
          .split("\n")
          .filter((s) => s.trim().length > 0)
          .slice(0, 4)
          .map((s) => s.replace(/^- /, "").trim())

        setSuggestions(arr)
        setVisible(true)
      } catch (err) {
        console.error("Suggestion error:", err)
      }
    }, 600) // ⏳ 600ms wait → no aggressive suggestions

    return () => clearTimeout(timeout)
  }, [prompt])

  return { suggestions, visible, setVisible }
}
