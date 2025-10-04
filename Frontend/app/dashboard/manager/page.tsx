"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ApprovalsTable } from "@/components/manager/approvals-table"
import { TeamExpensesTable } from "@/components/manager/team-expenses-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useExpenses } from "@/hooks/use-expenses"
import { DollarSign, Clock, CheckCircle, XCircle } from "lucide-react"

export default function ManagerDashboard() {
  const { expenses, isLoading } = useExpenses()

  const pendingCount = expenses?.filter((e) => e.status === "pending").length || 0
  const approvedCount = expenses?.filter((e) => e.status === "approved").length || 0
  const rejectedCount = expenses?.filter((e) => e.status === "rejected").length || 0
  const totalAmount = expenses?.filter((e) => e.status === "approved").reduce((sum, e) => sum + e.baseAmount, 0) || 0

  return (
    <ProtectedRoute allowedRoles={["manager"]}>
      <DashboardLayout title="Manager Dashboard">
        <div className="space-y-8">
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : pendingCount}
                </div>
                <p className="text-xs text-muted-foreground">Awaiting your review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : approvedCount}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : rejectedCount}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Approved</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : `$${totalAmount.toFixed(2)}`}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Approvals */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Pending Approvals</h2>
            <ApprovalsTable />
          </section>

          {/* Team Expenses History */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Team Expenses</h2>
            <TeamExpensesTable />
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
