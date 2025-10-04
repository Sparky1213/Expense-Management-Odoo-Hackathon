"use client"

import { use } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { WorkflowStatus } from "@/components/workflow-status"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [expense, setExpense] = useState<any>(null)

  useEffect(() => {
    const stored = localStorage.getItem("expenses")
    if (stored) {
      const expenses = JSON.parse(stored)
      const found = expenses.find((e: any) => e.id === resolvedParams.id)
      setExpense(found)
    }
  }, [resolvedParams.id])

  if (!expense) {
    return (
      <ProtectedRoute allowedRoles={["employee"]}>
        <DashboardLayout title="Expense Details">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Expense not found</p>
            <Link href="/dashboard/employee">
              <Button className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Mock workflow steps based on expense status
  const workflowSteps = [
    {
      name: "Submission",
      status: "completed" as const,
      approver: expense.employeeName,
      timestamp: expense.date,
    },
    {
      name: "Manager Review",
      status:
        expense.status === "pending"
          ? ("pending" as const)
          : expense.status === "approved"
            ? ("completed" as const)
            : ("rejected" as const),
      approver: "John Manager",
      timestamp: expense.status !== "pending" ? new Date().toISOString() : undefined,
      comments: expense.remarks,
    },
    {
      name: "Finance Approval",
      status: expense.status === "approved" ? ("completed" as const) : ("upcoming" as const),
      approver: "Finance Team",
      timestamp: expense.status === "approved" ? new Date().toISOString() : undefined,
    },
  ]

  return (
    <ProtectedRoute allowedRoles={["employee"]}>
      <DashboardLayout title="Expense Details">
        <div className="space-y-6">
          <Link href="/dashboard/employee">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Expense Details */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{expense.description}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold">
                    {expense.currency.toUpperCase()} {expense.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium capitalize">{expense.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(expense.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(expense.status)}</div>
                </div>
                {expense.receipt && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Receipt</p>
                    <img
                      src={expense.receipt || "/placeholder.svg"}
                      alt="Receipt"
                      className="rounded-lg border max-w-full h-auto"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Workflow Status */}
            <WorkflowStatus steps={workflowSteps} />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
