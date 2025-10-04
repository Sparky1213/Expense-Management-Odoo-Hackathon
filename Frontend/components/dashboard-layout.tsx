"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { LogOut, Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { NotificationsPanel } from "@/components/notifications-panel"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DashboardNav } from "@/components/dashboard-nav"

interface DashboardLayoutProps {
  children: ReactNode
  title: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <DashboardNav />
              </SheetContent>
            </Sheet>

            <h1 className="text-xl font-semibold">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <NotificationsPanel />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block w-64 border-r min-h-[calc(100vh-4rem)] sticky top-16">
          <DashboardNav />
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
