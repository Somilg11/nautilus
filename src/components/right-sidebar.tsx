"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

import APIKeyInput from "@/components/ui/APIKeyInput"
import { usePromptSuggestions } from "@/lib/usePromptSuggestions"


import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash, Send, ChevronDown } from "lucide-react"

import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectValue,
  SelectContent,
} from "@/components/ui/select"

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"

import { useFlow } from "@/lib/flow-context"
import { generateFlow } from "@/lib/ai-client"
import { MarkerType } from "react-flow-renderer"

// AI Model Icons
import { SiOpenai, SiGoogle, SiPlanetscale as SiGroq } from "react-icons/si"
import { SiClaude as TbBrandAnthropic } from "react-icons/si"
import { JSX } from "react/jsx-runtime"

/* -----------------------------
   AI MODEL TYPE
----------------------------- */
type AIModel = "openai" | "gemini" | "claude" | "groq"

const modelIcons: Record<AIModel, JSX.Element> = {
  openai: <SiOpenai className="h-4 w-4 text-primary" />,
  gemini: <SiGoogle className="h-4 w-4 text-blue-500" />,
  claude: <TbBrandAnthropic className="h-4 w-4 text-amber-600" />,
  groq: <SiGroq className="h-4 w-4 text-red-600" />,
}

/* ===========================================================
   COMPONENT: RIGHT SIDEBAR
=========================================================== */
export default function RightSidebar({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const {
    nodes,
    setNodes,
    setEdges,
    selectedNodeId,
    setSelectedNodeId,
  } = useFlow()

  const selectedNode =
    nodes.find((n) => n.id === selectedNodeId) || null

  /* ---------------------------------------------
     NODE PROPERTIES
  --------------------------------------------- */

  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [color, setColor] = useState("default")

  useEffect(() => {
    if (selectedNode) {
      setName(selectedNode.data.label ?? "")
      setDesc(selectedNode.data.description ?? "")
      setColor(selectedNode.data.color ?? "default")
    }
  }, [selectedNode])

  useEffect(() => {
    if (!selectedNode) return

    const t = setTimeout(() => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === selectedNode.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  label: name,
                  description: desc,
                  color,
                },
              }
            : n
        )
      )
    }, 150)

    return () => clearTimeout(t)
  }, [name, desc, color])

  function deleteNode() {
    if (!selectedNode) return
    setNodes((prev) => prev.filter((n) => n.id !== selectedNode.id))
    setSelectedNodeId(null)
    onOpenChange(false)
  }

  /* ---------------------------------------------
     AI SETTINGS (Keys, Model)
  --------------------------------------------- */

  const [model, setModel] = useState<AIModel>("openai")

  const [openaiKey, setOpenaiKey] = useState("")
  const [geminiKey, setGeminiKey] = useState("")
  const [claudeKey, setClaudeKey] = useState("")
  const [groqKey, setGroqKey] = useState("")

  // Load keys on client only
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOpenaiKey(localStorage.getItem("openai_key") || "")
      setGeminiKey(localStorage.getItem("gemini_key") || "")
      setClaudeKey(localStorage.getItem("claude_key") || "")
      setGroqKey(localStorage.getItem("groq_key") || "")
    }
  }, [])

  function saveKeys() {
    if (typeof window === "undefined") return

    localStorage.setItem("openai_key", openaiKey)
    localStorage.setItem("gemini_key", geminiKey)
    localStorage.setItem("claude_key", claudeKey)
    localStorage.setItem("groq_key", groqKey)
    alert("Keys saved!")
  }

  function clearKeys() {
    if (typeof window === "undefined") return

    localStorage.removeItem("openai_key")
    localStorage.removeItem("gemini_key")
    localStorage.removeItem("claude_key")
    localStorage.removeItem("groq_key")

    setOpenaiKey("")
    setGeminiKey("")
    setClaudeKey("")
    setGroqKey("")
  }

  /* ---------------------------------------------
     AI FLOW GENERATION FUNCTION
  --------------------------------------------- */

  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const { suggestions, visible, setVisible } = usePromptSuggestions(prompt)

  async function handleGenerate() {
    try {
      setLoading(true)

      const keys = {
        openai: openaiKey,
        gemini: geminiKey,
        claude: claudeKey,
        groq: groqKey,
      }

      if (!keys[model]) {
        alert(`Missing API key for ${model}`)
        return
      }

      let data: any
      try {
        data = await generateFlow(prompt, model, keys)
      } catch (err) {
        console.error("AI ERROR:", err)
        alert("Invalid AI JSON response. Try again.")
        return
      }

      if (!data?.nodes || !data?.edges) {
        console.error("Invalid AI response:", data)
        alert("AI did not return nodes/edges.")
        return
      }

      // Auto layout
      let y = 30
      const laidOutNodes = data.nodes.map((n: any) => ({
        ...n,
        type: "nautilusNode",
        position: { x: 250, y: (y += 140) },
      }))

      const laidOutEdges = data.edges.map((e: any, i: number) => ({
        id: "e" + i,
        source: e.source,
        target: e.target,
        markerEnd: { type: MarkerType.Arrow },
      }))

      setNodes(laidOutNodes)
      setEdges(laidOutEdges)

      onOpenChange(false)
    } catch (err) {
      console.error("Flow generation failed:", err)
      alert("AI failed to generate a diagram.")
    } finally {
      setLoading(false)
    }
  }

  /* ===========================================================
     RENDER
  =========================================================== */

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 p-0">

        <Tabs defaultValue="properties" className="h-full flex flex-col">

          {/* ---------------- TOP TABS ---------------- */}
          <div className="border-b p-4">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="assistant">AI</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          {/* ====================================================
             PROPERTIES TAB
          ==================================================== */}
          <TabsContent value="properties" className="flex-1 p-4">
            {!selectedNode ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Click a node to edit its properties.
              </div>
            ) : (
              <div className="space-y-4">

                <div>
                  <label className="text-sm">Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div>
                  <label className="text-sm">Description</label>
                  <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
                </div>

                <div>
                  <label className="text-sm block mb-1">Color</label>
                  <Select onValueChange={setColor} value={color}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="yellow">Yellow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="destructive"
                  onClick={deleteNode}
                  className="w-full"
                >
                  <Trash className="mr-2 h-4 w-4" /> Delete Node
                </Button>

              </div>
            )}
          </TabsContent>

          {/* ====================================================
             AI ASSISTANT TAB
          ==================================================== */}
          <TabsContent value="assistant" className="flex-1 flex flex-col">

            {/* MODEL SELECTOR */}
            <div className="flex items-center justify-between p-3 border-b">
              <div className="font-semibold flex items-center gap-2">
                {modelIcons[model]}
                {model.toUpperCase()}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full h-8 w-8 flex items-center justify-center"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-44">

                  <DropdownMenuItem
                    onClick={() => setModel("openai")}
                    className={model === "openai" ? "bg-accent" : ""}
                  >
                    <SiOpenai className="mr-2" /> OpenAI {openaiKey ? "✓" : "✗"}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setModel("gemini")}
                    className={model === "gemini" ? "bg-accent" : ""}
                  >
                    <SiGoogle className="mr-2" /> Gemini {geminiKey ? "✓" : "✗"}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setModel("claude")}
                    className={model === "claude" ? "bg-accent" : ""}
                  >
                    <TbBrandAnthropic className="mr-2" /> Claude {claudeKey ? "✓" : "✗"}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setModel("groq")}
                    className={model === "groq" ? "bg-accent" : ""}
                  >
                    <SiGroq className="mr-2" /> Groq {groqKey ? "✓" : "✗"}
                  </DropdownMenuItem>

                </DropdownMenuContent>
              </DropdownMenu>

            </div>

            {/* CHAT AREA */}
            <ScrollArea className="flex-1 p-4 space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <strong>AI:</strong> Describe the architecture you want generated.
              </div>
            </ScrollArea>

            {/* PROMPT INPUT (FREEZE-FIXED) */}


       {/* PROMPT INPUT */}

            {/* PROMPT INPUT */}
<div className="border-t p-3 flex flex-col gap-3 relative">

{/* TEXTAREA */}
<Textarea
  className="flex-1 min-h-[100px]"
  placeholder="e.g. Microservices with auth, queue, billing…"
  value={prompt}
  onChange={(e) => setPrompt(e.target.value)}
  onKeyDown={(e) => e.stopPropagation()} // prevent ReactFlow freeze
/>

{/* AI SUGGESTIONS */}
{visible && suggestions.length > 0 && (
  <div
    className="
      absolute bottom-[90px] left-3 right-3 
      bg-white dark:bg-gray-900
      shadow-lg rounded-lg border z-50 
      max-h-60 overflow-auto animate-in fade-in
    "
  >

    {/* CLOSE BUTTON */}
    <div className="flex justify-end p-2">
      <button
        onClick={() => setVisible(false)}
        className="text-xs text-gray-500 hover:text-gray-700"
      >
        ✕ Close
      </button>
    </div>

    {/* SUGGESTION ITEMS */}
    {suggestions.map((s, i) => (
      <div
        key={i}
        className="
          px-3 py-2 text-sm cursor-pointer
          hover:bg-gray-100 dark:hover:bg-gray-800
          rounded-md transition
        "
        onMouseDown={() => {  // ← FIX double-click issue
          setPrompt(s)
          setVisible(false)
        }}
      >
        {s}
      </div>
    ))}
  </div>
)}

{/* SEND BUTTON */}
<Button onClick={handleGenerate} disabled={loading}>
  {loading ? "..." : <Send className="h-5 w-5" />}
</Button>
</div>






          </TabsContent>

          {/* ====================================================
             SETTINGS TAB
          ==================================================== */}
          <TabsContent value="settings" className="p-4 space-y-4">

            <APIKeyInput
              label="OpenAI API Key"
              value={openaiKey}
              onChange={setOpenaiKey}
            />

            <APIKeyInput
              label="Gemini API Key"
              value={geminiKey}
              onChange={setGeminiKey}
            />

            <APIKeyInput
              label="Claude API Key"
              value={claudeKey}
              onChange={setClaudeKey}
            />

            <APIKeyInput
              label="Groq API Key"
              value={groqKey}
              onChange={setGroqKey}
            />

            <Button onClick={saveKeys} className="w-full">
              Save Keys
            </Button>

            <Button
              variant="destructive"
              onClick={clearKeys}
              className="w-full"
            >
              Clear Keys
            </Button>

          </TabsContent>

        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
