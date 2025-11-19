import BentoItem from "./BentoItem"
import { ChartLine, MessageCircle, Grid, Sparkles, Layers } from "lucide-react"

export default function BentoGrid() {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto p-6 pb-20">

      {/* ANALYTICS - LARGE CARD */}
      <BentoItem
        icon={<ChartLine className="h-4 w-4" />}
        title="Advanced system analytics"
        desc="Understand your architecture complexity"
        className="lg:col-span-2 h-[260px]"
      >
        <div className="mt-auto w-full h-32 rounded-xl bg-gradient-to-br from-yellow-400/30 to-orange-500/20 p-3">
          <div className="text-white font-semibold text-xl">$68,900</div>
          <div className="text-green-400 text-xs">+25%</div>
          <div className="w-full h-[2px] bg-white/20 mt-3 rounded">
            <div className="w-2/3 h-full bg-orange-400 rounded"></div>
          </div>
        </div>
      </BentoItem>

      {/* SUPPORT */}
      <BentoItem
        icon={<MessageCircle className="h-4 w-4" />}
        title="AI System Assistant"
        desc="Generate diagrams in seconds"
        className="h-[260px]"
      >
        <div className="text-white/70 text-sm mt-auto">
          “Generate a scalable microservice setup”
        </div>
      </BentoItem>

      {/* INTEGRATIONS */}
      <BentoItem
        icon={<Grid className="h-4 w-4" />}
        title="Integrations"
        desc="Works with your tools"
        className="h-[260px]"
      >
        <div className="flex gap-4 mt-auto opacity-80">
          <img src="/icons/notion.svg" className="h-8" />
          <img src="/icons/slack.svg" className="h-8" />
          <img src="/icons/jira.svg" className="h-8" />
          <img src="/icons/figma.svg" className="h-8" />
        </div>
      </BentoItem>

      {/* TEMPLATES */}
      <BentoItem
        icon={<Layers className="h-4 w-4" />}
        title="Smart Templates"
        desc="Uber, Instagram, WhatsApp & more"
        className="lg:col-span-2 h-[260px]"
      >
        <div className="grid grid-cols-3 gap-3 mt-auto">
          <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-center text-white/80 text-xs">
            Uber
          </div>
          <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-center text-white/80 text-xs">
            Instagram
          </div>
          <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-center text-white/80 text-xs">
            Spotify
          </div>
        </div>
      </BentoItem>

      {/* CUSTOMIZATION */}
      <BentoItem
        icon={<Sparkles className="h-4 w-4" />}
        title="Customize Anything"
        desc="Drag & align nodes easily"
        className="h-[260px]"
      >
        <div className="w-full h-24 bg-white/5 border border-white/10 rounded-xl mt-auto"></div>
      </BentoItem>
    </div>
  )
}
