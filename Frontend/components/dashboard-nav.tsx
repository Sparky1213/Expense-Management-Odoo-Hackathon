"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Receipt, Users, Settings, FileText } from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard/employee",
    icon: LayoutDashboard,
    roles: ["employee"],
  },
  {
    title: "My Expenses",
    href: "/dashboard/employee/expenses",
    icon: Receipt,
    roles: ["employee"],
  },
  {
    title: "Manager Dashboard",
    href: "/dashboard/manager",
    icon: FileText,
    roles: ["manager"],
  },
  {
    title: "Admin Dashboard",
    href: "/dashboard/admin",
    icon: Settings,
    roles: ["admin"],
  },
  {
    title: "User Management",
    href: "/dashboard/admin/users",
    icon: Users,
    roles: ["admin"],
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string>("")

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (stored) {
      const user = JSON.parse(stored)
      setUserRole(user.role)
    }
  }, [])

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole))

  return (
    <nav className="flex flex-col gap-2 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold px-2">ExpenseFlow</h2>
        <p className="text-sm text-muted-foreground px-2 capitalize">{userRole} Portal</p>
      </div>
      {filteredItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
