"use client";

import React from "react";
import Link from "next/link";
import { FaGithub, FaBolt, FaEdit, FaLayerGroup, FaShareAlt } from "react-icons/fa";
import { GiNautilusShell } from "react-icons/gi";

export default function AboutPage() {
  // Shared card style matching the Landing Page theme
  const cardStyle =
    "bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-8 text-zinc-100 transition-colors duration-300 hover:border-zinc-700";

  return (
    <div className="min-h-screen w-full bg-black text-zinc-100 font-sans">
      
      {/* ---- NAV (Simple Top Bar) ---- */}
      <nav className="w-full border-b border-zinc-900 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
           <Link href="/" className="flex items-center gap-2 group">
             <GiNautilusShell className="text-2xl text-zinc-400 group-hover:text-white transition-colors"/>
             <span className="font-bold tracking-tight text-xl">nautilus</span>
           </Link>
           <Link href="https://github.com/Somilg11/nautilus" className="text-zinc-400 hover:text-white transition-colors">
             <FaGithub className="text-2xl" />
           </Link>
        </div>
      </nav>

      <main className="px-6 py-20">
        
        {/* ---- HERO SECTION ---- */}
        <header className="max-w-3xl mx-auto text-center mb-24">
          <div className="inline-block mb-6 px-3 py-1 border border-zinc-800 rounded-full bg-zinc-900/50">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">About The Project</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-6 text-white">
            Nautilus
          </h1>
          <p className="text-xl md:text-2xl text-zinc-500 font-medium leading-relaxed">
            The open-source, AI-powered system design studio for engineers, architects, and creators.
          </p>
        </header>

        {/* ---- WHAT IS NAUTILUS ---- */}
        <section className="max-w-4xl mx-auto mb-24 space-y-8">
          <div className={`${cardStyle} border-l-4 border-l-zinc-100`}>
            <h2 className="text-2xl font-bold mb-4 tracking-tight text-white">What is Nautilus?</h2>
            <p className="text-zinc-400 leading-relaxed text-lg mb-4">
              Nautilus is a next-generation system design platform that lets you build, visualize, and 
              collaborate on architecture diagrams directly in the browser.  
              No downloads. No friction. Just a beautiful, intelligent design environment backed by AI.
            </p>
            <p className="text-zinc-400 leading-relaxed text-lg">
              Whether you&apos;re designing microservices, distributed systems, queue-based architectures, 
              data pipelines, or cloud deployments — Nautilus gives you the tools to do it faster, 
              cleaner, and more intelligently.
            </p>
          </div>
        </section>

        {/* ---- FEATURES GRID ---- */}
        <section className="max-w-5xl mx-auto mb-24">
          <h2 className="text-3xl font-bold mb-10 tracking-tighter text-center">Why Nautilus?</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feature 1 */}
            <div className={cardStyle}>
              <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 mb-4">
                 <FaBolt className="text-zinc-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">AI-Powered Architecture</h3>
              <p className="text-zinc-500">
                Generate complete system designs using natural language.  
                Need “Uber system design”? You’ll get a full diagram instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={cardStyle}>
              <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 mb-4">
                 <FaEdit className="text-zinc-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Drag-and-Drop Editing</h3>
              <p className="text-zinc-500">
                Every component can be moved, aligned, grouped, duplicated, and customized 
                effortlessly with our sleek modern editor.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={cardStyle}>
              <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 mb-4">
                 <FaLayerGroup className="text-zinc-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Real Templates</h3>
              <p className="text-zinc-500">
                Generate real architectural layouts: Instagram, WhatsApp, Netflix, YouTube, 
                Spotify, Uber, Zomato, and more.
              </p>
            </div>

            {/* Feature 4 */}
            <div className={cardStyle}>
              <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 mb-4">
                 <FaShareAlt className="text-zinc-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Share & Export</h3>
              <p className="text-zinc-500">
                Export JSON, PNG screenshots, or share a real-time URL containing your design state.
              </p>
            </div>
          </div>
        </section>

        {/* ---- HOW IT WORKS (Technical) ---- */}
        <section className="max-w-4xl mx-auto mb-24">
          <h2 className="text-3xl font-bold mb-8 tracking-tighter">Under The Hood</h2>

          <div className={`${cardStyle} space-y-6`}>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Nautilus uses a blend of <strong className="text-white font-medium">React Flow</strong>, <strong className="text-white font-medium">AI-driven element inference</strong>, and 
              custom-built alignment logic to create an incredibly smooth diagramming experience.
            </p>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["ReactFlow canvas engine", "AI Natural Language Parsing", "Custom Node types (DB, API, etc.)", "Local Persistence (IndexDB/LocalStorage)", "Undo/Redo History Stack"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-500">
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---- CONTRIBUTING ---- */}
        <section className="max-w-4xl mx-auto mb-24">
          <h2 className="text-3xl font-bold mb-8 tracking-tighter">Contributing</h2>

          <div className="grid gap-6">
            <p className="text-zinc-500 text-lg leading-relaxed">
              Nautilus is fully open-source. Whether you want to fix bugs, improve UI/UX, add templates, or help expand AI capabilities — your contribution matters.
            </p>

            {/* Setup Code Block */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
               <div className="bg-zinc-900/50 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                 <span className="text-xs font-mono text-zinc-500 uppercase">Terminal</span>
                 <div className="flex gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
                 </div>
               </div>
               <pre className="p-6 font-mono text-sm text-zinc-300 whitespace-pre-wrap">
git clone https://github.com/Somilg11/nautilus.git{'\n'}
cd nautilus{'\n'}
npm install{'\n'}
npm run dev
               </pre>
            </div>

            <div className={`${cardStyle} mt-4`}>
              <h3 className="text-lg font-bold mb-4 text-white">Areas to Contribute</h3>
              <ul className="space-y-2 text-zinc-400">
                <li>• Add new system design templates (Airbnb, LinkedIn, Swiggy)</li>
                <li>• Improve node styling or add new node types</li>
                <li>• Enhance AI parsing logic for better system understanding</li>
                <li>• Fix bugs in selection, alignment, grouping, or drag behavior</li>
              </ul>
            </div>
          </div>
        </section>

      </main>

      {/* ---- FOOTER ---- */}
      <footer className="text-center text-zinc-600 py-10 border-t border-zinc-900 bg-black text-sm">
        <p>© {new Date().getFullYear()} Nautilus — Open Source System Designer</p>
      </footer>
    </div>
  );
}