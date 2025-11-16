import Toolbar from "@/components/toolbar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col h-screen">
            <Toolbar />
            <div className="flex flex-1 overflow-hidden">
                {children}
            </div>
        </div>
    )
}