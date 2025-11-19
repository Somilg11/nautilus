"use client";


import { FaMagic, FaTools, FaLayerGroup, FaShareAlt } from "react-icons/fa";

export default function GuidePage() {
  // Consistent card styling
  const cardStyle =
    "bg-zinc-950 border border-zinc-800 rounded-2xl p-8 flex flex-col items-start transition-all duration-300 hover:border-zinc-600 hover:bg-zinc-900/30 group";

  return (
    <div className="min-h-screen w-full bg-black text-zinc-100 font-sans">

      <main className="max-w-5xl mx-auto px-6 py-20">
        
        {/* ---- HEADER ---- */}
        <header className="mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50">
             <div className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse"></div>
             <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Documentation</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-white">
            Nautilus Guide
          </h1>
          
          <p className="text-xl text-zinc-500 max-w-2xl leading-relaxed">
            Learn how to master the dashboard — from AI generation and templates to advanced editing and version control.
          </p>
        </header>

        {/* ---- GRID SECTIONS ---- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* 1. AI Assistant */}
          <section className={cardStyle}>
            <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 group-hover:border-zinc-600 transition-colors">
              <FaMagic className="text-xl text-zinc-400 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">AI Assistant</h2>
            <p className="text-zinc-400 leading-relaxed mb-6">
              Use natural language prompts to generate entire architectures instantly. 
              Type &ldquo;Design a Twitter clone&rdquo; and watch Nautilus build the nodes and edges for you.
            </p>
            <div className="mt-auto w-full pt-6 border-t border-zinc-900">
               <span className="text-xs font-mono text-zinc-600 uppercase">Tip: Try &ldquo;Refine this&rdquo; prompt</span>
            </div>
          </section>

          {/* 2. Editing Tools */}
          <section className={cardStyle}>
            <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 group-hover:border-zinc-600 transition-colors">
              <FaTools className="text-xl text-zinc-400 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Editing Suite</h2>
            <ul className="space-y-3 text-zinc-400 w-full">
              {["Copy / Paste / Duplicate", "Group & Ungroup Nodes", "Auto-Align & Distribute", "Infinite Canvas Navigation"].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-600 group-hover:bg-zinc-400 transition-colors" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* 3. Templates */}
          <section className={cardStyle}>
            <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 group-hover:border-zinc-600 transition-colors">
              <FaLayerGroup className="text-xl text-zinc-400 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Templates</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Don&apos;t start from scratch. Load industry-standard architectures directly onto your canvas.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
                {["Uber", "Netflix", "WhatsApp", "Instagram"].map(tag => (
                    <span key={tag} className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-500 font-mono">
                        {tag}
                    </span>
                ))}
            </div>
          </section>

          {/* 4. Sharing */}
          <section className={cardStyle}>
            <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 group-hover:border-zinc-600 transition-colors">
              <FaShareAlt className="text-xl text-zinc-400 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Export & Share</h2>
            <p className="text-zinc-400 leading-relaxed">
              Nautilus supports generating compressed read-only links for quick sharing. 
              You can also export high-res PNGs or save the raw JSON state locally.
            </p>
          </section>

        </div>

        {/* ---- FOOTER NOTE ---- */}
        <div className="mt-16 p-6 rounded-xl border border-zinc-900 bg-zinc-950/50 text-center">
          <p className="text-zinc-500 text-sm font-medium">
            More guides coming soon — including real-time collaboration and versioning history.
          </p>
        </div>

      </main>
    </div>
  );
}