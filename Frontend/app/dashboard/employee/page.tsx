"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UploadReceiptSection } from "@/components/employee/upload-receipt-section"
import { ExpenseForm } from "@/components/employee/expense-form"
import { ExpenseHistoryTable } from "@/components/employee/expense-history-table"
import { useState } from "react"

export default function EmployeeDashboard() {
  const [parsedData, setParsedData] = useState<{
    merchant: string
    amount: number | null
    date: string
    category: string
    currency: string | null
  } | null>(null)

  // Track selected file from upload section (image or PDF)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  return (
    <ProtectedRoute allowedRoles={["employee"]}>
      <DashboardLayout title="Employee Dashboard">
        <div className="space-y-8">
          {/* Upload Receipt Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Submit New Expense</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              <UploadReceiptSection onParsedData={setParsedData} onFileSelected={setSelectedFile} />
              <ExpenseForm parsedData={parsedData} selectedFile={selectedFile} onSubmitSuccess={() => { setParsedData(null); setSelectedFile(null); }} />
            </div>
          </section>

          {/* Expense History */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Expense History</h2>
            <ExpenseHistoryTable />
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
