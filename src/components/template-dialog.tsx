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
      <DialogContent className="max-w-md p-0 overflow-hidden">
        
        {/* ---------- Header ---------- */}
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-lg font-bold">
            Select a Template
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose from ready-made architecture patterns.
          </p>
        </DialogHeader>

        {/* ---------- Search Field ---------- */}
        <div className="px-6 pb-4">
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm"
          />
        </div>

        {/* ---------- Template List ---------- */}
        <ScrollArea className="max-h-80 px-6 pb-6">
          <div className="flex flex-col space-y-1">

            {filtered.map((tpl, index) => (
              <div key={tpl.id}>
                
                <Button
                  variant="ghost"
                  className="
                    w-full justify-start text-left
                    px-3 py-3 rounded-md
                    hover:bg-accent/60 transition-colors
                    flex flex-col items-start gap-1
                  "
                  onClick={() => {
                    onSelect(tpl)
                    onOpenChange(false)
                  }}
                >
                  <span className="font-medium text-[15px]">{tpl.name}</span>
                  <span className="text-xs text-muted-foreground leading-tight">
                    {tpl.description}
                  </span>
                </Button>

                {index < filtered.length - 1 && (
                  <Separator className="my-2 opacity-40" />
                )}
              </div>
            ))}

            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No templates found.
              </p>
            )}

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
