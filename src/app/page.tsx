import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/navbar"

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-col items-center justify-center h-[calc(100vh-64px)] text-center px-4">
        <h1 className="text-5xl font-bold mb-4">
          Design Systems with the Power of AI.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-8">
          Welcome to Nautilus, your open-source architect. Build, visualize, and
          generate complex system designs all in your browser. Free, fast, and intelligent.
        </p>
        <Link href="/dashboard">
          <Button size="lg">
            Go to Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </main>
    </>
  )
}