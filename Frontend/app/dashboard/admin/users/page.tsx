"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UserManagement } from "@/components/admin/user-management"

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout title="User Management">
        <div className="space-y-6">
          <UserManagement />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
