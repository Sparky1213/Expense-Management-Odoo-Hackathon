"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ApprovalRulesConfig } from "@/components/admin/approval-rules-config"
import { CompanyExpensesTable } from "@/components/admin/company-expenses-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useExpenses } from "@/hooks/use-expenses"
import { useUsers } from "@/hooks/use-users"
import { Users, DollarSign, TrendingUp, FileText, Info } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminDashboard() {
  const { expenses, isLoading: expensesLoading } = useExpenses()
  const { users, isLoading: usersLoading } = useUsers()

  const totalExpenses = expenses?.length || 0
  const totalAmount = expenses?.filter((e) => e.status === "approved").reduce((sum, e) => sum + e.baseAmount, 0) || 0
  const pendingAmount = expenses?.filter((e) => e.status === "pending").reduce((sum, e) => sum + e.baseAmount, 0) || 0
  const totalUsers = users?.length || 0

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout title="Admin Dashboard">
        <div className="space-y-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 space-y-1">
                  <CardTitle className="text-base">Admin Dashboard</CardTitle>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Welcome to your admin dashboard. Here you can manage company expenses, users, and approval rules. 
                    Use the navigation menu to access different sections of the system.
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>


          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usersLoading ? "..." : totalUsers}
                </div>
                <p className="text-xs text-muted-foreground">Active employees</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {expensesLoading ? "..." : totalExpenses}
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {expensesLoading ? "..." : `$${totalAmount.toFixed(2)}`}
                </div>
                <p className="text-xs text-muted-foreground">Total approved</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {expensesLoading ? "..." : `$${pendingAmount.toFixed(2)}`}
                </div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="expenses" className="space-y-4">
            <TabsList>
              <TabsTrigger value="expenses">Company Expenses</TabsTrigger>
              <TabsTrigger value="rules">Approval Rules</TabsTrigger>
            </TabsList>

            <TabsContent value="expenses" className="space-y-4">
              <CompanyExpensesTable />
            </TabsContent>

            <TabsContent value="rules" className="space-y-4">
              <ApprovalRulesConfig />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
