import { GiNautilusShell } from "react-icons/gi"

/**
 * The Nautilus shell mark. Used everywhere a logo is needed so the brand
 * stays in one place.
 */
export default function NautilusMark({
  className = "h-6 w-6",
  title = "Nautilus",
}: {
  className?: string
  title?: string
}) {
  return (
    <span
      role="img"
      aria-label={title}
      className={`grid place-items-center rounded-md bg-foreground text-background ${className}`}
    >
      <GiNautilusShell className="h-[70%] w-[70%]" />
    </span>
  )
}
