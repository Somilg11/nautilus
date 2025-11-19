import React from "react"

export default function BentoItem({
  icon,
  title,
  desc,
  children,
  className = "",
}: {
  icon: React.ReactNode
  title: string
  desc?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-6 flex flex-col justify-between shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] ${className}`}
    >
      <div>
        <div className="flex items-center gap-2 mb-3 text-white">
          {icon}
          <span className="text-sm font-medium opacity-70">{title}</span>
        </div>

        {desc && (
          <p className="text-lg font-semibold text-white mb-4">{desc}</p>
        )}
      </div>

      {children}
    </div>
  )
}
