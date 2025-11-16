import { Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GiNautilusShell } from "react-icons/gi"

export default function Navbar() {
    return (
        <header className="h-16 border-b flex items-center justify-between px-6">
            <div className="flex items-center">
            <GiNautilusShell className="mr-2 h-6 w-6" />
            <h1 className="text-2xl font-bold">nautilus</h1>
            </div>
            <a href="https://github.com/" target="_blank" rel="noreferrer">
                <Button variant="ghost">
                    <Github className="mr-2 h-5 w-5" /> GitHub
                </Button>
            </a>
        </header>
    )
}