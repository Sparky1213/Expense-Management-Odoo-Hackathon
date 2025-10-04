"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useExpenses } from "@/hooks/use-expenses"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import { apiClient } from "../../lib/api"

export function CompanyExpensesTable() {
  const { expenses, isLoading, approveExpense, rejectExpense } = useExpenses()
  const { toast } = useToast()
  const [ruleMap, setRuleMap] = useState<Record<string, any>>({})

  // Fetch applicable rule for each expense
  useEffect(() => {
    let mounted = true
    const fetchRules = async () => {
      try {
        const missing = expenses?.filter(e => !ruleMap[e._id || e.id]) || []
        for (const exp of missing) {
          try {
            const resp = await apiClient.getApplicableRule(exp._id || exp.id)
            if (!mounted) return
            if (resp && resp.success) {
              setRuleMap(prev => ({ ...prev, [exp._id || exp.id]: resp.data?.rule ?? null }))
            }
          } catch (err) {
            console.debug('Failed to fetch applicable rule for', exp._id || exp.id, err)
          }
        }
      } catch (err) {
        console.error('Error fetching applicable rules:', err)
      }
    }
    if (expenses && expenses.length > 0) fetchRules()
    return () => { mounted = false }
  }, [expenses])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "partially_approved":
        return <Badge variant="outline">Partially Approved</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleApprove = async (expenseId: string) => {
    const success = await approveExpense(expenseId, "Admin override approval")
    if (success) {
      toast({
        title: "Expense approved",
        description: "The expense has been approved successfully.",
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to approve expense. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (expenseId: string) => {
    const success = await rejectExpense(expenseId, "Rejected by admin", "Admin override")
    if (success) {
      toast({
        title: "Expense rejected",
        description: "The expense has been rejected successfully.",
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to reject expense. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Company Expenses</CardTitle>
          <CardDescription>View and manage all expenses across the organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground">Loading expenses...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Handle undefined expenses
  if (!expenses) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Company Expenses</CardTitle>
          <CardDescription>View and manage all expenses across the organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground">No expenses data available</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Company Expenses</CardTitle>
        <CardDescription>View and manage all expenses across the organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Admin Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No expenses in the system yet
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense._id || expense.id}>
                    <TableCell className="font-medium">
                      {expense.submittedBy?.name || 'Unknown User'}
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="capitalize">{expense.category}</TableCell>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {expense.baseCurrency} {expense.baseAmount.toFixed(2)}
                      {expense.originalCurrency !== expense.baseCurrency && (
                        <div className="text-xs text-muted-foreground">
                          ({expense.originalCurrency} {expense.originalAmount.toFixed(2)})
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    <TableCell className="text-right">
                      {expense.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-500 hover:text-green-500 hover:bg-green-500/10"
                            onClick={() => handleApprove(expense._id || expense.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleReject(expense._id || expense.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
