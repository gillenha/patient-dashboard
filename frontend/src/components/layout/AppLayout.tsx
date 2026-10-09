import { useState } from "react"
import { HeartPulse, Menu } from "lucide-react"
import { Link, Outlet } from "react-router"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

import { SidebarNav } from "./SidebarNav"

export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="bg-background text-foreground flex h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <HeartPulse className="text-primary size-5" />
          <span>Patient Dashboard</span>
        </Link>
        <div className="ml-auto" />
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="bg-card hidden w-60 shrink-0 overflow-y-auto border-r md:block">
          <SidebarNav />
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
