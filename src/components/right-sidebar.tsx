"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash } from "lucide-react"

export default function RightSidebar() {
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null)

  return (
    <aside className="w-96 border-l h-full flex flex-col">
      <Tabs defaultValue="properties" className="h-full">
        <div className="p-4 border-b">
          <TabsList>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* PROPERTIES */}
          <TabsContent value="properties" className="h-full p-4">
            {!selectedNode ? (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <div className="mb-2">Click a node to edit its properties.</div>
                </div>
              </div>
            ) : (
              <form className="space-y-4">
                <div>
                  <label className="text-sm block mb-1">Name</label>
                  <Input defaultValue={selectedNode} />
                </div>

                <div>
                  <label className="text-sm block mb-1">Description</label>
                  <Textarea />
                </div>

                <div>
                  <label className="text-sm block mb-1">Color</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="yellow">Yellow</SelectItem>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button variant="destructive">
                    <Trash className="mr-2" /> Delete Node
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>

          {/* AI ASSISTANT */}
          <TabsContent value="assistant" className="h-full p-0 flex flex-col">
            <ScrollArea className="flex-1 p-4 space-y-4">
              <div className="rounded-lg p-3 bg-muted/10">
                <strong>AI:</strong> Hello! Ask me to generate a flow, like
                &quot;Create a 3-tier architecture&quot;.
              </div>

              <div className="ml-auto rounded-lg p-3 bg-primary/10 self-end">
                <strong>You:</strong> What&apos;s the best database for a social media
                app?
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea className="flex-1" placeholder="Ask AI..." />
                <Button size="icon">Send</Button>
              </div>
            </div>
          </TabsContent>

          {/* SETTINGS */}
          <TabsContent value="settings" className="h-full p-4">
            <form className="space-y-4">
              <div>
                <h3 className="font-semibold">API Keys</h3>
                <p className="text-sm text-muted-foreground">
                  Your keys are stored locally in your browser.
                </p>
              </div>

              <div>
                <label className="text-sm block mb-1">OpenAI API Key</label>
                <Input type="password" />
              </div>

              <div>
                <label className="text-sm block mb-1">Gemini API Key</label>
                <Input type="password" />
              </div>

              <div className="flex justify-end">
                <Button>Save Keys</Button>
              </div>
            </form>
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  )
}
