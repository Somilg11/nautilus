/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useState, useEffect } from "react"
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash, Send } from "lucide-react"
import { Select, SelectTrigger, SelectItem, SelectValue, SelectContent } from "@/components/ui/select"
import { useFlow } from "@/lib/flow-context"

export default function RightSidebar({ open, onOpenChange }: any) {
    const { nodes, setNodes, selectedNodeId, setSelectedNodeId } = useFlow()
    const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null

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
                        ? { ...n, data: { ...n.data, label: name, description: desc, color } }
                        : n
                )
            )
        }, 200)
        return () => clearTimeout(t)
    }, [name, desc, color])

    function deleteNode() {
        if (!selectedNode) return
        setNodes((prev) => prev.filter((n) => n.id !== selectedNode.id))
        setSelectedNodeId(null)
        onOpenChange(false)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-96 p-0">
                <Tabs defaultValue="properties" className="h-full flex flex-col">
                    <div className="border-b p-4">
                        <TabsList className="grid grid-cols-3">
                            <TabsTrigger value="properties">Properties</TabsTrigger>
                            <TabsTrigger value="assistant">AI</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="properties" className="flex-1 p-4">
                        {!selectedNode ? (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
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
                                    <Select onValueChange={setColor} defaultValue={color}>
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


                                <Button variant="destructive" onClick={deleteNode} className="w-full">
                                    <Trash className="mr-2 h-4 w-4" /> Delete Node
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    {/* AI ASSISTANT */}
                    <TabsContent value="assistant" className="flex-1 flex flex-col">
                        <ScrollArea className="flex-1 p-4 space-y-4">
                            <div className="bg-muted rounded-lg p-3 w-fit max-w-[80%]">
                                <strong>AI:</strong> Ask me to generate architecture diagrams!
                            </div>

                            <div className="bg-primary text-primary-foreground rounded-lg p-3 ml-auto w-fit max-w-[80%]">
                                Example: “Recommend a DB for analytics”
                            </div>
                        </ScrollArea>

                        <div className="border-t p-3 flex gap-2">
                            <Textarea className="flex-1" placeholder="Ask AI..." />
                            <Button size="icon">
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                    </TabsContent>

                    {/* SETTINGS */}
                    <TabsContent value="settings" className="p-4 space-y-4">
                        <div>
                            <label>OpenAI API Key</label>
                            <Input type="password" />
                        </div>
                        <div>
                            <label>Gemini API Key</label>
                            <Input type="password" />
                        </div>

                        <Button>Save Keys</Button>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    )
}
