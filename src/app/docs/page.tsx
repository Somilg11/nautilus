"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Copy, Check } from "lucide-react"
import { useState } from "react"
import { NodeIcons } from "@/components/nodes/node-icons"

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Header */}
            <header className="border-b sticky top-0 bg-background/80 backdrop-blur-md z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back to App
                            </Button>
                        </Link>
                        <div className="h-6 w-px bg-border" />
                        <h1 className="font-bold text-xl tracking-tight">Nautilus Docs</h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>v1.0.0</span>
                        <Link href="https://github.com/Somilg11/nautilus" className="hover:text-foreground transition-colors">
                            GitHub
                        </Link>
                    </div>
                </div>
            </header>

            <div className="flex-1 container mx-auto px-4 py-8 flex gap-10">
                {/* Sidebar Navigation */}
                <aside className="w-64 hidden lg:block sticky top-24 h-[calc(100vh-8rem)]">
                    <ScrollArea className="h-full pr-4">
                        <nav className="space-y-6">
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm tracking-wider text-primary">GETTING STARTED</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li><a href="#introduction" className="hover:text-foreground block py-1">Introduction</a></li>
                                    <li><a href="#interface" className="hover:text-foreground block py-1">Interface Overview</a></li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm tracking-wider text-primary">FEATURES</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li><a href="#toolbar" className="hover:text-foreground block py-1">Toolbar & Tools</a></li>
                                    <li><a href="#ai-generation" className="hover:text-foreground block py-1">AI Generation</a></li>
                                    <li><a href="#templates" className="hover:text-foreground block py-1">Templates</a></li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm tracking-wider text-primary">CONTRIBUTING</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li><a href="#contributing-templates" className="hover:text-foreground block py-1">Adding Templates</a></li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm tracking-wider text-primary">REFERENCE</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li><a href="#icon-reference" className="hover:text-foreground block py-1">Icon Reference</a></li>
                                </ul>
                            </div>
                        </nav>
                    </ScrollArea>
                </aside>

                {/* Main Content */}
                <main className="flex-1 max-w-3xl space-y-12 pb-20">

                    {/* Introduction */}
                    <section id="introduction" className="space-y-4">
                        <h2 className="text-3xl font-bold tracking-tight">Introduction</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Nautilus is an open-source system design and architecture visualization tool.
                            It allows you to create complex diagrams using a drag-and-drop interface,
                            powered by AI to generate initial structures from simple text prompts.
                        </p>
                    </section>

                    <Separator />

                    {/* Interface Overview */}
                    <section id="interface" className="space-y-6">
                        <h2 className="text-2xl font-bold tracking-tight">Interface Overview</h2>

                        <div className="grid gap-6">
                            <div className="border rounded-lg p-6 bg-card">
                                <h3 className="font-semibold text-lg mb-2">Left Sidebar</h3>
                                <p className="text-muted-foreground text-sm">
                                    The component library. Drag and drop nodes onto the canvas.
                                    Use the search bar to filter components by name (e.g., "AWS", "Database").
                                </p>
                            </div>

                            <div className="border rounded-lg p-6 bg-card">
                                <h3 className="font-semibold text-lg mb-2">Right Sidebar</h3>
                                <p className="text-muted-foreground text-sm mb-4">
                                    Context-aware panels for editing and configuration.
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                    <li><strong>Properties:</strong> Edit the selected node's label, description, and color.</li>
                                    <li><strong>AI Assistant:</strong> Generate diagrams using LLMs (OpenAI, Gemini, Claude, Groq).</li>
                                    <li><strong>Settings:</strong> Manage your API keys securely (stored in local storage).</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <Separator />

                    {/* Toolbar */}
                    <section id="toolbar" className="space-y-6">
                        <h2 className="text-2xl font-bold tracking-tight">Toolbar & Tools</h2>
                        <p className="text-muted-foreground">
                            Located at the top of the canvas, the toolbar provides essential tools for managing your diagram.
                        </p>

                        <div className="overflow-hidden rounded-lg border">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground font-medium">
                                    <tr>
                                        <th className="p-4">Action</th>
                                        <th className="p-4">Description</th>
                                        <th className="p-4">Shortcut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    <tr>
                                        <td className="p-4 font-medium">Copy / Paste</td>
                                        <td className="p-4 text-muted-foreground">Duplicate selected nodes and edges.</td>
                                        <td className="p-4 font-mono text-xs">Cmd+C / Cmd+V</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-medium">Group / Ungroup</td>
                                        <td className="p-4 text-muted-foreground">Combine nodes into a container or dissolve a container.</td>
                                        <td className="p-4 font-mono text-xs">-</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-medium">Alignment</td>
                                        <td className="p-4 text-muted-foreground">Align nodes Left, Center, or Right.</td>
                                        <td className="p-4 font-mono text-xs">-</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-medium">Distribution</td>
                                        <td className="p-4 text-muted-foreground">Distribute nodes evenly horizontally.</td>
                                        <td className="p-4 font-mono text-xs">-</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-medium">Zoom / Fit</td>
                                        <td className="p-4 text-muted-foreground">Zoom in/out or fit the entire diagram to the screen.</td>
                                        <td className="p-4 font-mono text-xs">-</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <Separator />

                    {/* Templates */}
                    <section id="templates" className="space-y-6">
                        <h2 className="text-2xl font-bold tracking-tight">Templates</h2>
                        <p className="text-muted-foreground">
                            Nautilus comes with a library of production-grade architecture templates.
                            Click the <strong>Templates</strong> button in the header to browse.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            {['Netflix', 'Uber', 'WhatsApp', 'YouTube', 'Spotify', 'Microservices'].map(t => (
                                <div key={t} className="p-3 border rounded bg-muted/20 text-sm font-medium text-center">
                                    {t} Architecture
                                </div>
                            ))}
                        </div>
                    </section>

                    <Separator />

                    {/* Contributing Templates */}
                    <section id="contributing-templates" className="space-y-6">
                        <h2 className="text-2xl font-bold tracking-tight">Contributing Templates</h2>
                        <p className="text-muted-foreground">
                            We welcome community contributions! To add a new template, follow this JSON structure in a new file under <code>src/lib/templates/</code>.
                        </p>

                        <div className="relative">
                            <pre className="p-4 rounded-lg bg-muted overflow-x-auto text-sm font-mono">
                                {`export const MyTemplate = {
  id: "unique-id",
  name: "Template Name",
  description: "Short description",
  nodes: [
    {
      id: "node-1",
      type: "nautilusNode",
      position: { x: 0, y: 0 },
      data: { 
        label: "Node Label", 
        icon: "icon_key", // See Icon Reference
        color: "blue" 
      },
    }
  ],
  edges: [
    {
      id: "e1",
      source: "node-1",
      target: "node-2",
      type: "deletableEdge",
      markerEnd: { type: MarkerType.Arrow }
    }
  ]
}`}
                            </pre>
                        </div>
                    </section>

                    <Separator />

                    {/* Icon Reference */}
                    <section id="icon-reference" className="space-y-6">
                        <h2 className="text-2xl font-bold tracking-tight">Icon Reference</h2>
                        <p className="text-muted-foreground">
                            Use these keys in the <code>icon</code> field of your node data to render the corresponding icon.
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {Object.keys(NodeIcons).map((key) => (
                                <div key={key} className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="text-2xl mb-2 text-primary">
                                        {NodeIcons[key]}
                                    </div>
                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                        {key}
                                    </code>
                                </div>
                            ))}
                        </div>
                    </section>

                </main>
            </div>
        </div>
    )
}
