"use client"

import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, User } from "lucide-react"

export function RoleSwitcherDemo() {
  const { user, login } = useAuth()

  const switchRole = async (role: "admin" | "manager" | "employee") => {
    // Demo mode: quickly switch between roles for testing
    const demoEmails = {
      admin: "admin@demo.com",
      manager: "manager@demo.com",
      employee: "employee@demo.com",
    }

    await login(demoEmails[role], "demo123")
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-sm">Demo Mode - Quick Role Switch</CardTitle>
        <CardDescription className="text-xs">Test different dashboards by switching roles</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => switchRole("admin")} className="flex-1">
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </Button>
        <Button size="sm" variant="outline" onClick={() => switchRole("manager")} className="flex-1">
          <Users className="h-3 w-3 mr-1" />
          Manager
        </Button>
        <Button size="sm" variant="outline" onClick={() => switchRole("employee")} className="flex-1">
          <User className="h-3 w-3 mr-1" />
          Employee
        </Button>
      </CardContent>
    </Card>
  )
}
