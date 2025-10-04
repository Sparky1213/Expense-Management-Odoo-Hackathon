"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ExpensesTable } from "@/components/employee/expenses-table"

export default function EmployeeExpensesPage() {
  return (
    <ProtectedRoute allowedRoles={["employee"]}>
      <DashboardLayout title="My Expenses">
        <div className="space-y-6">
          <ExpensesTable />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
