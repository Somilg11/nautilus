"use client";

import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";

type ChatInputProps = {
  onSend: (message: string) => void;
  loading: boolean;
  suggestions: string[];
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
};

export default function ChatInput({
  onSend,
  loading,
  suggestions,
  visible,
  setVisible,
}: ChatInputProps) {
  const [prompt, setPrompt] = useState("");

  function handleSend() {
    if (!prompt.trim() || loading) return;
    onSend(prompt);
    setPrompt("");
  }

  return (
    <div className="border-t p-3 relative">
      <div className="relative">
        <Textarea
          className="w-full pr-12 rounded-xl resize-none"
          placeholder="e.g. Microservices with auth, queue, billing…"
          rows={3}
          value={prompt}
          onChange={(e) => {
            const newValue = e.target.value;
            setPrompt(newValue);
            setVisible(newValue.trim().length > 0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <button
          onClick={handleSend}
          disabled={loading || !prompt.trim()}
          className="absolute right-3 bottom-3 bg-blue-600 p-2 rounded-lg text-white"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      {visible && suggestions.length > 0 && (
        <div
          tabIndex={-1}
          className="absolute left-3 right-3 bottom-24 bg-[#1E1E1E]
                     text-white border border-white/10 rounded-lg 
                     shadow-xl p-2 z-50 max-h-64 overflow-y-auto"
        >
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setPrompt(s);
                setVisible(false);
              }}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-white/10"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
