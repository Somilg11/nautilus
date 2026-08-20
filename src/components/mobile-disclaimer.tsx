"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MonitorX } from "lucide-react"

const BREAKPOINT = 768

/**
 * Small-screen warning for the editor only.
 *
 * The canvas needs a pointer and room to drag; the marketing, docs and about
 * pages do not, so this is mounted by the dashboard rather than the root
 * layout. Dismissing it is remembered for the session — resizing a window
 * should not re-nag someone who already said "continue".
 */
export default function MobileDisclaimer() {
    const [open, setOpen] = useState(false)
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        if (dismissed) return

        const check = () => setOpen(window.innerWidth < BREAKPOINT)

        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [dismissed])

    function close() {
        setDismissed(true)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[420px]">
                <DialogHeader>
                    <div className="mx-auto mb-3 w-fit rounded-full bg-muted p-3">
                        <MonitorX className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <DialogTitle className="text-center text-[16px]">
                        The editor works best on a larger screen
                    </DialogTitle>
                    <DialogDescription className="text-center text-[13px] leading-6">
                        Nautilus&apos; canvas is built around dragging, multi-select and
                        keyboard shortcuts, so it is rough on a phone. The docs and the
                        rest of the site are fully mobile-friendly.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button onClick={close} className="w-full">
                        Continue anyway
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/docs">Read the docs instead</Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
