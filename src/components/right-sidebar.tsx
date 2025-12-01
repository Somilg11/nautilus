"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { usePromptSuggestions } from "@/lib/usePromptSuggestions";
import { useState, useEffect, useRef, forwardRef } from "react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

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

// MODEL TYPE
type AIModel = "openai" | "gemini" | "claude" | "groq";
type ChatMessage = { id: string; role: "user" | "ai"; content: string };

const modelIcons: Record<AIModel, JSX.Element> = {
  openai: <SiOpenai className="h-4 w-4 text-primary" />,
  gemini: <SiGoogle className="h-4 w-4 text-blue-500" />,
  claude: <TbBrandAnthropic className="h-4 w-4 text-amber-600" />,
  groq: <SiGroq className="h-4 w-4 text-red-600" />,
};

const hasKey = (model: AIModel, keys: Record<AIModel, string>) => !!keys[model];

export default function RightSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {

  const { nodes, setNodes, setEdges, selectedNodeId, setSelectedNodeId } = useFlow();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  // NODE EDITING STATE
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState("default");

  useEffect(() => {
    if (selectedNode) {
      setName(selectedNode.data.label ?? "");
      setDesc(selectedNode.data.description ?? "");
      setColor(selectedNode.data.color ?? "default");
    } else {
      setName("");
      setDesc("");
      setColor("default");
    }
  }, [selectedNode]);

  // Save node changes (debounced)
  useEffect(() => {
    if (!selectedNode) return;
    const t = setTimeout(() => {
      setNodes(prev =>
        prev.map(n =>
          n.id === selectedNode.id
            ? { ...n, data: { ...n.data, label: name, description: desc, color } }
            : n
        )
      );
    }, 300);
    return () => clearTimeout(t);
  }, [name, desc, color, selectedNode?.id, setNodes]);

  function deleteNode() {
    if (!selectedNode) return;
    setNodes(prev => prev.filter((n) => n.id !== selectedNode.id));
    setSelectedNodeId(null);
    onOpenChange(false);
  }

  // AI SETTINGS
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
      const savedModel = localStorage.getItem("preferred_model") as AIModel | null;
      if (savedModel) setModel(savedModel);
    }
  }, []);

  function saveKeys() {
    if (typeof window === "undefined") return;
    localStorage.setItem("openai_key", openaiKey.trim());
    localStorage.setItem("gemini_key", geminiKey.trim());
    localStorage.setItem("claude_key", claudeKey.trim());
    localStorage.setItem("groq_key", groqKey.trim());
    localStorage.setItem("preferred_model", model);
    alert("Keys saved!"); // Or use toast
  }

  function clearKeys() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("openai_key");
    localStorage.removeItem("gemini_key");
    localStorage.removeItem("claude_key");
    localStorage.removeItem("groq_key");
    localStorage.removeItem("preferred_model");
    setOpenaiKey(""); setGeminiKey(""); setClaudeKey(""); setGroqKey("");
    setModel("openai");
  }

  // CHAT STATE
  const [prompt, setPrompt] = useState("");
  const { suggestions, visible, setVisible } = usePromptSuggestions(prompt);
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "ai", content: "What are we building today?" }
  ]);

  const scrollAreaRef = useRef<HTMLElement>(null); // Ref for ScrollArea root

  // AUTO-SCROLL FIX: Callback to target internal viewport
  const scrollToBottom = () => {
    if (!scrollAreaRef.current) return;
    const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      (viewport as HTMLDivElement).scrollTop = (viewport as HTMLDivElement).scrollHeight;
    }
  };

  useEffect(() => {
    // Delay for post-render + input blur
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // HANDLE SEND (append to existing flow)
  async function handleGenerate() {
    if (!prompt.trim() || loading) return;

    const text = prompt.trim();
    setPrompt("");
    setVisible(false); // Hide suggestions

    const id = crypto.randomUUID();

    setMessages(prev => [
      ...prev,
      { id, role: "user" as const, content: text },
      { id: "temp", role: "ai" as const, content: "Generating architecture..." }
    ]);

    setLoading(true);

    try {
      const keys = { openai: openaiKey, gemini: geminiKey, claude: claudeKey, groq: groqKey };
      const response: AIResponse = await generateFlow(text, model, keys);

      if ("nodes" in response && "edges" in response) {
        let y = 50;
        const newNodes = response.nodes.map(n => ({
          ...n,
          id: n.id || crypto.randomUUID(),
          type: "nautilusNode" as const,
          position: { x: 300, y: (y += 160) }
        }));

        const newEdges = response.edges.map((e, i) => ({
          id: `e-${Date.now()}-${i}`,
          source: e.source,
          target: e.target,
          markerEnd: { type: MarkerType.Arrow },
        }));

        setNodes(prev => [...prev, ...newNodes]); // Append!
        setEdges(prev => [...prev, ...newEdges]); // Append!
      }

      setMessages(prev =>
        prev.map(m => m.id === "temp"
          ? { ...m, content: "Architecture generated successfully!" }
          : m
        )
      );

    } catch (err: any) {
      setMessages(prev =>
        prev.map(m => m.id === "temp"
          ? { ...m, content: `Error: ${err?.message || "Failed to generate"}` }
          : m
        )
      );
    }

    setLoading(false);
  }

  // Forward ref for ScrollArea (to attach callback)
  const ScrollAreaWithRef = forwardRef<HTMLDivElement, React.ComponentProps<typeof ScrollArea>>((props, ref) => (
    <ScrollArea {...props} ref={ref} />
  ));
  ScrollAreaWithRef.displayName = "ScrollAreaWithRef";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 p-0 flex flex-col bg-background border-l">

        <Tabs defaultValue="properties" className="flex-1 flex flex-col overflow-hidden"> {/* Default to properties */}

          {/* TAB HEADER */}
          <div className="border-b px-4 py-3">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          {/* ==============================================
              PROPERTIES TAB (with Delete Button)
          =============================================== */}
          <TabsContent value="properties" className="flex-1 overflow-y-auto p-4 pt-6">
            {!selectedNode ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <User className="h-8 w-8" />
                </div>
                <p className="text-sm">Select a node to edit its properties</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Label</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-2" placeholder="Node name" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
                  <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="mt-2 min-h-32 resize-none" placeholder="Describe this component..." />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color Theme</label>
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="yellow">Yellow</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="destructive" onClick={deleteNode} className="w-full mt-8">
                  <Trash className="mr-2 h-4 w-4" /> Delete Node
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ==============================================
              AI CHAT TAB (Fixed Scrolling)
          =============================================== */}
          <TabsContent value="assistant" className="flex-1 flex flex-col overflow-hidden">

            {/* MODEL HEADER */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2 text-sm font-medium">
                {modelIcons[model]}
                <span className="capitalize">{model}</span>
                {!hasKey(model, { openai: openaiKey, gemini: geminiKey, claude: claudeKey, groq: groqKey }) && (
                  <span className="text-xs text-red-400">(no key)</span>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Change <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {(["openai","gemini","claude","groq"] as const).map(m => (
                    <DropdownMenuItem key={m} onClick={() => setModel(m)}>
                      <div className="flex items-center gap-2 w-full justify-between">
                        {modelIcons[m]} <span className="capitalize">{m}</span>
                        <div className={`w-2 h-2 rounded-full ${hasKey(m, { openai: openaiKey, gemini: geminiKey, claude: claudeKey, groq: groqKey }) ? "bg-green-500" : "bg-red-500"}`} />
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* CHAT AREA - Fixed with callback ref, no nesting */}
            <ScrollAreaWithRef 
              ref={el => {
                scrollAreaRef.current = el || null;
                scrollToBottom(); // Initial scroll on mount
              }} 
              className="flex-1 px-4 py-4 min-h-0"
            >
              <div className="space-y-4 pb-4"> {/* Content directly as children */}
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted px-4 py-3 rounded-2xl">Thinking...</div>
                  </div>
                )}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollAreaWithRef>

            {/* INPUT AREA */}
            <div className="border-t p-4 space-y-3">
              <div className="relative">
                <Textarea
                  placeholder="Describe your app architecture..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                      return;
                    }
                  }}
                  className="min-h-24 resize-none pr-12"
                  disabled={loading}
                />

                {/* Prompt Suggestions (restored) */}
                {visible && suggestions.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover border rounded-lg shadow-lg p-2 z-50">
                    <div className="flex justify-between items-center mb-2 px-2">
                      <span className="text-xs text-muted-foreground">Suggestions</span>
                      <button onClick={() => setVisible(false)} className="text-xs hover:bg-muted rounded px-2 py-1">×</button>
                    </div>
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => { setPrompt(s); setVisible(false); }}
                        className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* SEND BUTTON */}
                <Button
                  size="icon"
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || loading}
                  className="absolute bottom-3 right-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

          </TabsContent>

          {/* ==============================================
              SETTINGS TAB
          =============================================== */}
          <TabsContent value="settings" className="p-6 space-y-5">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">OpenAI API Key</label>
                <Input type="password" placeholder="sk-..." value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Gemini API Key</label>
                <Input type="password" placeholder="AIza..." value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Claude API Key</label>
                <Input type="password" placeholder="sk-ant-..." value={claudeKey} onChange={(e) => setClaudeKey(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Groq API Key</label>
                <Input type="password" placeholder="gsk_..." value={groqKey} onChange={(e) => setGroqKey(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="pt-4 space-y-3">
              <Button onClick={saveKeys} className="w-full">Save Keys</Button>
              <Button variant="outline" onClick={clearKeys} className="w-full">Clear All Keys</Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">Keys stored in browser (localStorage).</p>
          </TabsContent>

        </Tabs>
      </SheetContent>
    </Sheet>
  );
}