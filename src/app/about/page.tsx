"use client";

import React from "react";
import Link from "next/link";
import { FaGithub, FaBolt, FaEdit, FaLayerGroup, FaShareAlt, FaCode, FaHeart, FaRobot } from "react-icons/fa";
import { GiNautilusShell } from "react-icons/gi";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen w-full bg-black text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white overflow-x-hidden">

      {/* ---- NAV ---- */}
      <nav className="w-full border-b border-zinc-900 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-zinc-900 p-1.5 rounded-lg group-hover:bg-zinc-800 transition-colors">
              <GiNautilusShell className="text-xl text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg">nautilus</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block">
              Documentation
            </Link>
            <Link href="https://github.com/Somilg11/nautilus" target="_blank" className="text-zinc-400 hover:text-white transition-colors">
              <FaGithub className="text-xl" />
            </Link>
          </div>
        </div>
      </nav>

      <main>

        {/* ---- HERO SECTION ---- */}
        <section className="relative pt-32 pb-20 px-6 border-b border-zinc-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black">
          {/* Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/50 border border-zinc-800 text-xs font-medium text-zinc-400 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              v1.0.0 is now live
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent pb-2">
              System design for the <br /> modern engineer.
            </h1>

            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Nautilus is the open-source, AI-powered workspace where architecture meets intelligence.
              Visualize, plan, and document complex systems at the speed of thought.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/">
                <Button size="lg" className="h-12 px-8 text-base rounded-full bg-white text-black hover:bg-zinc-200">
                  Start Designing <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="https://github.com/Somilg11/nautilus" target="_blank">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base rounded-full border-zinc-800 bg-black hover:bg-zinc-900 text-zinc-300">
                  <FaGithub className="mr-2 h-4 w-4" /> Star on GitHub
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ---- MISSION ---- */}
        <section className="py-24 px-6 border-b border-zinc-900">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-6">Built for clarity in a complex world.</h2>
              <div className="space-y-6 text-lg text-zinc-400 leading-relaxed">
                <p>
                  Modern software architecture is complex. Microservices, event-driven patterns, and cloud-native infrastructure
                  make it harder than ever to keep a mental model of your system.
                </p>
                <p>
                  We built Nautilus to solve this. It's not just a drawing tool—it's a thinking tool.
                  With AI assistance, smart templates, and a semantic understanding of your components,
                  Nautilus helps you communicate your technical vision clearly.
                </p>
              </div>
            </div>
            <div className="relative aspect-square md:aspect-auto md:h-[400px] bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden flex items-center justify-center group">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <GiNautilusShell className="text-9xl text-zinc-800 group-hover:text-zinc-700 transition-colors duration-500" />
            </div>
          </div>
        </section>

        {/* ---- AI DEMO SECTION ---- */}
        <section className="py-24 px-6 bg-zinc-950 border-b border-zinc-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-xl mb-4">
                <Sparkles className="h-6 w-6 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">From Prompt to Diagram</h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Describe your system in plain English, and watch Nautilus generate a complete, editable architecture diagram instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Chat UI */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 h-[400px] flex flex-col shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                <div className="flex-1 space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                      <FaCode className="text-xs text-zinc-400" />
                    </div>
                    <div className="bg-zinc-800 rounded-2xl rounded-tl-none p-3 text-sm text-zinc-300 max-w-[80%]">
                      What are we building today?
                    </div>
                  </div>
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white">U</span>
                    </div>
                    <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl rounded-tr-none p-3 text-sm text-blue-100 max-w-[80%]">
                      Design a scalable e-commerce backend with microservices, Redis caching, and a Postgres database.
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                      <FaRobot className="text-xs text-blue-400" />
                    </div>
                    <div className="bg-zinc-800 rounded-2xl rounded-tl-none p-3 text-sm text-zinc-300 max-w-[80%] animate-pulse">
                      Generating architecture...
                    </div>
                  </div>
                </div>

                {/* Input Mock */}
                <div className="mt-4 pt-4 border-t border-zinc-800 flex gap-2">
                  <div className="h-10 bg-zinc-950 rounded-md border border-zinc-800 flex-1" />
                  <div className="h-10 w-10 bg-blue-600 rounded-md" />
                </div>
              </div>

              {/* Diagram Preview */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl h-[400px] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:20px_20px]" />

                {/* Floating Nodes Animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-64 h-64">
                    {/* Center Node */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-zinc-900 border-2 border-blue-500 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.2)] z-10">
                      <FaLayerGroup className="text-blue-500 text-2xl" />
                    </div>

                    {/* Satellite Nodes */}
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i}
                        className="absolute w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-lg flex items-center justify-center shadow-lg transition-all duration-1000"
                        style={{
                          top: i === 0 ? '0' : i === 1 ? '50%' : i === 2 ? '100%' : '50%',
                          left: i === 0 ? '50%' : i === 1 ? '100%' : i === 2 ? '50%' : '0%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div className="w-2 h-2 rounded-full bg-zinc-500" />
                        {/* Connecting Lines (Pseudo) */}
                        <div className="absolute inset-0 border border-dashed border-zinc-800 -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}

                    {/* SVG Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none text-zinc-800" style={{ overflow: 'visible' }}>
                      <line x1="50%" y1="50%" x2="50%" y2="10%" stroke="currentColor" strokeWidth="2" />
                      <line x1="50%" y1="50%" x2="90%" y2="50%" stroke="currentColor" strokeWidth="2" />
                      <line x1="50%" y1="50%" x2="50%" y2="90%" stroke="currentColor" strokeWidth="2" />
                      <line x1="50%" y1="50%" x2="10%" y2="50%" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---- FEATURES GRID ---- */}
        <section className="py-24 px-6 bg-black">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to design better.</h2>
              <p className="text-zinc-400">Powerful features wrapped in a minimal, distraction-free interface.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <FaBolt />,
                  title: "AI Generation",
                  desc: "Turn text prompts into complete architecture diagrams instantly using OpenAI, Claude, or Gemini."
                },
                {
                  icon: <FaLayerGroup />,
                  title: "Smart Templates",
                  desc: "Production-ready patterns for Netflix, Uber, WhatsApp, and more at your fingertips."
                },
                {
                  icon: <FaEdit />,
                  title: "Fluid Editing",
                  desc: "A high-performance canvas engine that feels native. Group, align, and connect with ease."
                },
                {
                  icon: <FaCode />,
                  title: "Developer First",
                  desc: "Export to JSON, integrate with your workflow, and customize via open-source code."
                },
                {
                  icon: <FaShareAlt />,
                  title: "Share & Export",
                  desc: "Generate high-quality PNGs for your technical documentation or share live views."
                },
                {
                  icon: <FaHeart />,
                  title: "Open Source",
                  desc: "Free forever. No hidden fees. Built by the community, for the community."
                }
              ].map((feature, i) => (
                <div key={i} className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl hover:border-zinc-700 transition-colors group">
                  <div className="h-12 w-12 bg-zinc-900 rounded-lg flex items-center justify-center text-zinc-400 mb-6 group-hover:text-white group-hover:bg-zinc-800 transition-all">
                    <span className="text-xl">{feature.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-zinc-100">{feature.title}</h3>
                  <p className="text-zinc-500 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- CTA ---- */}
        <section className="py-32 px-6 border-t border-zinc-900">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold tracking-tight mb-6">Ready to build something great?</h2>
            <p className="text-xl text-zinc-400 mb-10">
              Join thousands of developers designing the future with Nautilus.
            </p>
            <Link href="/">
              <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-white text-black hover:bg-zinc-200">
                Launch Studio
              </Button>
            </Link>
          </div>
        </section>

      </main>

      {/* ---- FOOTER ---- */}
      <footer className="border-t border-zinc-900 bg-black py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <GiNautilusShell className="text-zinc-600" />
            <span className="font-bold text-zinc-600">nautilus</span>
          </div>
          <div className="text-sm text-zinc-600">
            © {new Date().getFullYear()} Open Source. MIT License.
          </div>
          <div className="flex gap-6">
            <Link href="https://github.com/Somilg11/nautilus" className="text-zinc-600 hover:text-zinc-400 transition-colors">GitHub</Link>
            <Link href="/docs" className="text-zinc-600 hover:text-zinc-400 transition-colors">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}