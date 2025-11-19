import React from "react";
import { FaGithub } from "react-icons/fa";
import { SiNextdotjs, SiTypescript, SiTailwindcss, SiReact, SiBuymeacoffee } from "react-icons/si";
import Link from "next/link";
import Image from "next/image";
import { GiNautilusShell } from "react-icons/gi";
import { IconType } from "react-icons";

// Badge Component
const TechBadge = ({ icon: Icon, label }: { icon: IconType; label: string }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 text-xs font-medium hover:text-zinc-200 hover:border-zinc-600 transition-all cursor-default">
    <Icon className="text-sm" />
    <span>{label}</span>
  </div>
);

export default function NautilusLanding() {
  // Shared class
  const cardStyle =
    "bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-100 hover:border-zinc-600 hover:bg-zinc-900/50 transition-colors duration-300";

  return (
    <div className="min-h-screen w-full bg-black text-white flex items-center justify-center p-4 md:p-8 font-sans">
      {/* GRID CONFIGURATION:
        Mobile: 1 column, auto height rows (stacking)
        Desktop (lg): 4 columns, fixed 120px height rows (bento look)
      */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-[minmax(100px,auto)] lg:grid-rows-[120px_120px_120px_120px] gap-4">
        
        {/* 1. Title (3 cols desktop) */}
        <div className={`${cardStyle} col-span-1 lg:col-span-3 p-8 lg:p-0`}>
          <h1 className="text-5xl font-bold tracking-tighter text-white">
            nautilus
          </h1>
        </div>

        {/* 2. Logo (1 col) */}
        <Link href="/about" className={`${cardStyle} col-span-1 group`}>
          <GiNautilusShell className="text-6xl text-zinc-400 group-hover:text-white transition-colors" />
        </Link>

        {/* 3. Docs (1 col, 2 rows high on desktop) */}
        <Link
          href="/guide"
          className={`${cardStyle} col-span-1 lg:row-span-2 items-end !justify-start p-6 group h-[200px] lg:h-auto`}
        >
          <span className="text-3xl font-bold uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">
            Docs
          </span>
        </Link>

        {/* 4. GitHub Link (1 col) */}
        <Link
          href="https://github.com/Somilg11/nautilus"
          className={`${cardStyle} col-span-1 group`}
        >
          <FaGithub className="text-5xl text-zinc-400 group-hover:text-white transition-colors" />
        </Link>

        {/* 5. Tech Stack (2 cols) */}
        <div className={`${cardStyle} col-span-1 lg:col-span-2 flex-col !items-start justify-center gap-3 p-6`}>
          <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider ml-1">Built With</span>
          <div className="flex flex-wrap gap-2">
            <TechBadge icon={SiNextdotjs} label="Next.js" />
            <TechBadge icon={SiTypescript} label="TypeScript" />
            <TechBadge icon={SiTailwindcss} label="Tailwind" />
            <TechBadge icon={SiReact} label="React-flows" />
          </div>
        </div>

        {/* 6. Developer Card (3 cols desktop to fill the row) */}
        <div className={`${cardStyle} col-span-1 lg:col-span-3 !justify-start px-6 gap-5`}>
          <div className="relative h-16 w-16 rounded-full overflow-hidden border border-zinc-700 shrink-0">
            <Image 
              src="/maintainer.jpeg" 
              alt="Dev"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <Link href="https://gsomil.vercel.app" target="_blank">
          <div className="flex flex-col justify-center">
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Maintainer</span>
            <span className="text-2xl font-semibold text-zinc-200 tracking-tight">Somilg11</span>
          </div>
          </Link>
        </div>

        {/* 7. Dashboard (3 cols desktop) */}
        <Link
          href="/dashboard"
          className={`${cardStyle} col-span-1 lg:col-span-3 group`}
        >
          <span className="text-3xl font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
            _Dashboard
          </span>
        </Link>

        {/* 8. Buy Me Coffee (1 col, sits next to dashboard) */}
        <Link
          href="https://buymeacoffee.com/gsomil"
          className={`${cardStyle} col-span-1 group hover:!border-yellow-600/50 hover:!bg-yellow-900/10 flex flex-col gap-2`}
        >
             <SiBuymeacoffee className="text-4xl text-zinc-500 group-hover:text-yellow-400 transition-colors" />
             <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 group-hover:text-yellow-200/70">Donate</span>
        </Link>

      </div>
    </div>
  );
}