// src/lib/usePromptSuggestions.ts
"use client"

import { useState, useEffect, useRef } from "react"
import { GoogleGenerativeAI } from "@google/generative-ai"

export function usePromptSuggestions(prompt: string) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [visible, setVisible] = useState(false)
  const lastValue = useRef("")

  useEffect(() => {
    const prevValue = lastValue.current
    lastValue.current = prompt
  
    // 🛑 DELETE / BACKSPACE → NO suggestions
    if (prompt.length < prevValue.length) {
      setSuggestions([])
      setVisible(false)
      return
    }
  
    // 🛑 Too small prompt → no suggestions
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
            `You are restricted to ONLY system design concepts.
          
          Generate EXACTLY 4 short suggestions (6–8 words each).
          
          RULES:
          - ONLY system-design / distributed-systems / backend architecture concepts.
          - Allowed topics: Redis, caching, queues, microservices, load balancers, API gateway,
            sharding, failover, replication, streaming, message brokers, scaling, fault tolerance.
          - STRICTLY NO concepts outside computer systems.
          - NO intro, NO explanations, NO bullets, NO numbering.
          - Output ONLY 4 plain lines.
          - Each line must be inspired ONLY by user text: "${prompt}".`
          );
          
          
  
        const text = result.response.text() ?? ""
  
        const arr = text
          .split("\n")
          .filter((s) => s.trim().length > 0)
          .slice(0, 4)
          .map((s) => s.replace(/^- /, "").trim())
  
        setSuggestions(arr)
        setVisible(true)
      } catch (err) {
        console.error(err)
      }
    }, 600)
  
    return () => clearTimeout(timeout)
  }, [prompt])
  

  return { suggestions, visible, setVisible }
}
