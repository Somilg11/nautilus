"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { usePromptSuggestions } from "@/lib/usePromptSuggestions";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash, Send, ChevronDown, User } from "lucide-react";

import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { useFlow } from "@/lib/flow-context";
import { generateFlow, AIResponse } from "@/lib/ai-client";
import { MarkerType } from "react-flow-renderer";

import { SiOpenai, SiGoogle, SiPlanetscale as SiGroq } from "react-icons/si";
import { SiClaude as TbBrandAnthropic } from "react-icons/si";
import { JSX } from "react/jsx-runtime";

/* -----------------------------
   AI MODEL TYPE
----------------------------- */
type AIModel = "openai" | "gemini" | "claude" | "groq";

const modelIcons: Record<AIModel, JSX.Element> = {
  openai: <SiOpenai className="h-4 w-4 text-primary" />,
  gemini: <SiGoogle className="h-4 w-4 text-blue-500" />,
  claude: <TbBrandAnthropic className="h-4 w-4 text-amber-600" />,
  groq: <SiGroq className="h-4 w-4 text-red-600" />,
};

export default function RightSidebar({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    nodes,
    setNodes,
    setEdges,
    selectedNodeId,
    setSelectedNodeId,
  } = useFlow();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  /* ---------------------------------------------
     NODE PROPERTIES STATES
  --------------------------------------------- */
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState("default");

  useEffect(() => {
    if (selectedNode) {
      setName(selectedNode.data.label ?? "");
      setDesc(selectedNode.data.description ?? "");
      setColor(selectedNode.data.color ?? "default");
    }
  }, [selectedNode]);

  useEffect(() => {
    if (!selectedNode) return;

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
      );
    }, 150);

    return () => clearTimeout(t);
  }, [name, desc, color]);

  function deleteNode() {
    if (!selectedNode) return;
    setNodes((prev) => prev.filter((n) => n.id !== selectedNode.id));
    setSelectedNodeId(null);
    onOpenChange(false);
  }

  /* ---------------------------------------------
     AI SETTINGS (Keys + Model)
  --------------------------------------------- */
  const [model, setModel] = useState<AIModel>("openai");

  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [groqKey, setGroqKey] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOpenaiKey(localStorage.getItem("openai_key") || "");
      setGeminiKey(localStorage.getItem("gemini_key") || "");
      setClaudeKey(localStorage.getItem("claude_key") || "");
      setGroqKey(localStorage.getItem("groq_key") || "");
    }
  }, []);

  const hasKey = (m: AIModel) => {
    if (m === "openai") return !!openaiKey;
    if (m === "gemini") return !!geminiKey;
    if (m === "claude") return !!claudeKey;
    if (m === "groq") return !!groqKey;
    return false;
  };

  function saveKeys() {
    if (typeof window === "undefined") return;
    localStorage.setItem("openai_key", openaiKey);
    localStorage.setItem("gemini_key", geminiKey);
    localStorage.setItem("claude_key", claudeKey);
    localStorage.setItem("groq_key", groqKey);
    alert("Keys saved!");
  }

  function clearKeys() {
    if (typeof window === "undefined") return;

    localStorage.removeItem("openai_key");
    localStorage.removeItem("gemini_key");
    localStorage.removeItem("claude_key");
    localStorage.removeItem("groq_key");

    setOpenaiKey("");
    setGeminiKey("");
    setClaudeKey("");
    setGroqKey("");
  }

  /* ---------------------------------------------
     AI CHAT STATES — KEEP THEM TOGETHER (IMPORTANT)
  --------------------------------------------- */
  const [prompt, setPrompt] = useState(""); // FINAL CORRECT POSITION
  const { suggestions, visible, setVisible } = usePromptSuggestions(prompt);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "ai"; content: string }>
  >([]);

  /* ---------------------------------------------
     AI CHAT HANLDER
  --------------------------------------------- */
  async function handleGenerate() {
    if (!prompt.trim()) return;

    const userMsg = prompt;
    setPrompt("");

    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const keys = {
        openai: openaiKey,
        gemini: geminiKey,
        claude: claudeKey,
        groq: groqKey,
      };

      if (!keys[model]) {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: `Please add an API key for ${model} in Settings.`,
          },
        ]);
        setLoading(false);
        return;
      }

      const response: AIResponse = await generateFlow(userMsg, model, keys);

      if ("type" in response && response.type === "message") {
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: response.content },
        ]);
      } else if ("nodes" in response && "edges" in response) {
        let y = 30;

        const laidOutNodes = response.nodes.map((n: any) => ({
          ...n,
          type: "nautilusNode",
          position: { x: 250, y: (y += 140) },
        }));

        const laidOutEdges = response.edges.map((e: any, i: number) => ({
          id: "e" + i,
          source: e.source,
          target: e.target,
          markerEnd: { type: MarkerType.Arrow },
        }));

        setNodes(laidOutNodes);
        setEdges(laidOutEdges);

        const message = ("message" in response) 
          ? (response as { message?: string }).message 
          : undefined;

        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: message || "I've generated the diagram for you on the canvas.",
          },
        ]);
      }
    } catch (err: any) {
      console.error("AI ERROR:", err);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: `Error: ${err?.message || "Something went wrong."}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  /* ---------------------------------------------
     RENDER UI
  --------------------------------------------- */
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-96 p-0 flex flex-col bg-background border-l"
      >
        <Tabs defaultValue="properties" className="flex-1 flex flex-col">
          <div className="border-b px-4 py-3">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="assistant">AI Chat</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          {/* ---------------- PROPERTIES TAB ---------------- */}
          <TabsContent value="properties" className="flex-1 p-4 overflow-y-auto">
            {!selectedNode ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <User className="h-6 w-6 opacity-50" />
                </div>
                <p>Select a node on the canvas to edit its properties.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Label
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-muted/50"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Description
                  </label>
                  <Textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="bg-muted/50 min-h-[100px]"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Color
                  </label>
                  <Select onValueChange={setColor} value={color}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default (Gray)</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="yellow">Yellow</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={deleteNode}
                    className="w-full"
                  >
                    <Trash className="mr-2 h-4 w-4" /> Delete Node
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ---------------- AI CHAT TAB ---------------- */}
          <TabsContent
            value="assistant"
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {/* MODEL SELECTOR */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
              <div className="text-sm font-medium flex items-center gap-2">
                {modelIcons[model]}
                <span className="capitalize">{model}</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs">
                    Change Model <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48">
                  {(["openai", "gemini", "claude", "groq"] as AIModel[]).map(
                    (m) => (
                      <DropdownMenuItem
                        key={m}
                        onClick={() => setModel(m)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          {modelIcons[m]}
                          <span className="capitalize">{m}</span>
                        </div>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            hasKey(m)
                              ? "bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]"
                              : "bg-red-500/50"
                          }`}
                        />
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* CHAT HISTORY */}
            <ScrollArea className="flex-1 p-4 space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <strong>AI:</strong> Describe the architecture you want generated.
              </div>
            </ScrollArea>
          {/* PROMPT INPUT WITH SUGGESTIONS */}
<div className="border-t p-3 flex flex-col gap-2 relative">

<Textarea
  className="flex-1"
  placeholder="e.g. Microservices with auth, queue, billing…"
  value={prompt}
  onChange={(e) => setPrompt(e.target.value)}
  onKeyDown={(e) => e.stopPropagation()}
  onKeyUp={(e) => e.stopPropagation()}
  onKeyPress={(e) => e.stopPropagation()}
/>
{visible && suggestions.length > 0 && (
  <div className="absolute left-3 right-3 bottom-16 
                  bg-[#1E1E1E] text-white 
                  border border-white/10 
                  rounded-lg shadow-xl p-2 z-50">

    {/* Close (X) Button */}
    <div className="flex justify-end mb-1">
      <button
        onClick={() => setVisible(false)}
        className="text-xs px-2 py-1 hover:bg-white/10 rounded"
      >
        ✕
      </button>
    </div>

    {suggestions.map((s, i) => (
      <button
        key={i}
        onClick={() => {
          setPrompt(s)
          setVisible(false)
        }}
        className="w-full text-left px-3 py-2 
                   rounded-md hover:bg-white/10 
                   transition text-sm"
      >
        {s}
      </button>
    ))}
  </div>
)}

<Button onClick={handleGenerate} disabled={loading} className="self-end">
  {loading ? "..." : <Send className="h-5 w-5" />}
</Button>

</div>
          </TabsContent>

          {/* ---------------- SETTINGS TAB ---------------- */}
          <TabsContent value="settings" className="p-4 space-y-4">
            <div>
              <label>OpenAI API Key</label>
              <Input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
            </div>

            <div>
              <label>Gemini API Key</label>
              <Input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
            </div>

            <div>
              <label>Claude API Key</label>
              <Input
                type="password"
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
              />
            </div>

            <div>
              <label>Groq API Key</label>
              <Input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
              />
            </div>

            <div className="pt-4 space-y-3">
              <Button onClick={saveKeys} className="w-full">
                Save API Keys
              </Button>

              <Button
                variant="outline"
                onClick={clearKeys}
                className="w-full text-destructive hover:text-destructive"
              >
                Clear All Keys
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Keys are stored locally in your browser.
            </p>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
