"use client"

import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { MonitorX } from "lucide-react"

export default function MobileDisclaimer() {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            if (window.innerWidth < 768) {
                setOpen(true)
            }
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="mx-auto bg-destructive/10 p-3 rounded-full mb-4 w-fit">
                        <MonitorX className="h-6 w-6 text-destructive" />
                    </div>
                    <DialogTitle className="text-center">Desktop Experience Recommended</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        Nautilus is optimized for desktop use. The canvas and editing tools may overflow or function incorrectly on smaller screens.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center pt-4">
                    <p className="text-xs text-muted-foreground">
                        Please switch to a larger device for the best experience.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
