import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Upload, Download, Play, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "./mode-toggle"
import { GiNautilusShell } from "react-icons/gi"
import Link from "next/link"

export default function Toolbar() {
    return (
        <div className="h-16 border-b flex items-center justify-between px-6">
            {/* Left */}
            <div className="flex items-center">
                <Link href="/">
                <div className="flex items-center">
                    <GiNautilusShell className="mr-2 h-6 w-6" />
                    {/* <h1 className="text-2xl font-bold">nautilus</h1> */}
                </div>
                </Link>
                <Separator orientation="vertical" className="h-6" />
                <Input defaultValue="Untitled Design" className="w-56" />
            </div>

            {/* Right */}
            <div className="flex items-center space-x-2">
                <Button variant="outline">Templates</Button>
                <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import</Button>
                <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
                <Button>Save</Button>
                <Separator orientation="vertical" className="h-6 mx-2" />
                <Button variant="outline"><Play className="mr-2 h-4 w-4" /> Run Flow</Button>
                <Button variant="ghost" size="icon">
                    <Sparkles className="h-5 w-5" />
                </Button>
                <ModeToggle />
            </div>
        </div>
    )
}