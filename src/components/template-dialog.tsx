/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AllTemplates } from "@/lib/templates"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"

export default function TemplateDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSelect: (template: any) => void
}) {
  const [search, setSearch] = useState("")

  const filtered = AllTemplates.filter((tpl) =>
    tpl.name.toLowerCase().includes(search.toLowerCase()) ||
    tpl.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden h-[80vh] flex flex-col">

        {/* ---------- Header ---------- */}
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <span className="bg-primary/10 p-2 rounded-md text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
            </span>
            Template Gallery
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Jumpstart your architecture with ready-made patterns and best practices.
          </p>
        </DialogHeader>

        {/* ---------- Search Field ---------- */}
        <div className="px-6 py-4 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <Input
              placeholder="Search templates (e.g. 'Microservices', 'AWS')..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="pl-9"
            />
          </div>
        </div>

        {/* ---------- Template List ---------- */}
        <ScrollArea className="flex-1 bg-muted/10 min-h-0">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((tpl) => (
              <button
                key={tpl.id}
                className="
                  group flex flex-col text-left
                  bg-card border rounded-xl overflow-hidden
                  hover:border-primary/50 hover:shadow-md transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary/20
                "
                onClick={() => {
                  onSelect(tpl)
                  onOpenChange(false)
                }}
              >
                {/* Preview Placeholder (could be an image later) */}
                <div className="h-32 bg-muted/30 w-full flex items-center justify-center border-b group-hover:bg-primary/5 transition-colors">
                  <div className="flex gap-2 opacity-50 grayscale group-hover:grayscale-0 transition-all">
                    {/* Abstract representation of nodes */}
                    <div className="w-8 h-8 rounded bg-primary/20 border border-primary/30"></div>
                    <div className="w-8 h-8 rounded bg-blue-500/20 border border-blue-500/30 translate-y-4"></div>
                    <div className="w-8 h-8 rounded bg-green-500/20 border border-green-500/30"></div>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-base group-hover:text-primary transition-colors">
                      {tpl.name}
                    </span>
                    {/* Optional: Add tags or badges here */}
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {tpl.description}
                  </p>

                  <div className="pt-2 flex items-center text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0">
                    Use Template →
                  </div>
                </div>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="bg-muted p-4 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                </div>
                <p className="text-lg font-medium">No templates found</p>
                <p className="text-sm">Try adjusting your search terms.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
