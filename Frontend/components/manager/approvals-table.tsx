"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useExpenses } from "@/hooks/use-expenses"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X } from "lucide-react"
import { ApprovalDialog } from "./approval-dialog"
import { apiClient, ApiResponse, ApprovalRuleData } from "@/lib/api"

interface Expense {
  id: string
  description: string
  submittedBy: {
    name: string
  }
  category: string
  amount: number
  baseAmount?: number
  baseCurrency?: string
  status: string
}

export function ApprovalsTable() {
  const { expenses, fetchPendingApprovals, isLoading, lastError } = useExpenses()
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null)
  const [action, setAction] = useState<"approve" | "reject" | null>(null)
  const [actedExpenses, setActedExpenses] = useState<Set<string>>(new Set())
  const [ruleMap, setRuleMap] = useState<Record<string, ApprovalRuleData['rule'] | undefined>>({})

  // Debug logging
  useEffect(() => {
    console.log('Current expenses:', expenses)
  }, [expenses])

  // Hardcoded manager details
  const managerName = "Jaimin Salvi"
  const managerRole = "Senior Engineering Manager"
  const managerDepartment = "Engineering"

  useEffect(() => {
    // Ensure we fetch latest pending approvals when component mounts
    fetchPendingApprovals()
  }, [])

  // Fetch applicable rule for each expense when expenses change
  useEffect(() => {
    let mounted = true
    const fetchRules = async () => {
      try {
        const missing = expenses.filter(e => e.id && !ruleMap[e.id])
        console.log("Expenses to fetch rules for:", missing.length)
        console.log("Current expenses:", expenses)
        for (const exp of missing) {
          try {
            const resp = await apiClient.getApplicableRule(exp.id)
            console.log("Rule response for expense", exp.id, ":", resp)
            if (!mounted) return
            if (resp && resp.success) {
              console.log("Setting rule for expense", exp.id, ":", resp.data?.rule)
              setRuleMap(prev => ({ ...prev, [exp.id]: resp.data?.rule }))
            }
          } catch (err) {
            console.error("Error fetching rule for expense", exp.id, ":", err)
          }
        }
      } catch (err) {
        console.error('Error in fetchRules:', err)
      }
    }
    
    if (expenses && expenses.length > 0) {
      console.log('Triggering fetchRules with expenses:', expenses)
      fetchRules()
    }
    
    return () => { mounted = false }
  }, [expenses])

  const pendingExpenses = expenses.filter((e) => e.status === "pending")

  const handleAction = (expenseId: string, actionType: "approve" | "reject") => {
    setSelectedExpense(expenseId)
    setAction(actionType)
  }

  const handleDialogClose = (wasActioned: boolean) => {
    if (wasActioned && selectedExpense) {
      setActedExpenses((prev) => new Set(prev).add(selectedExpense))
      // Refresh list after action
      fetchPendingApprovals()
    }
    setSelectedExpense(null)
    setAction(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Expenses Awaiting Approval</CardTitle>
              <div className="text-sm text-muted-foreground mt-1">
                Manager: {managerName} | Role: {managerRole} | Department: {managerDepartment}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => fetchPendingApprovals()}>
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {lastError && (
            <div className="mb-4 text-sm text-destructive">Error loading approvals: {lastError}</div>
          )}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading pending approvals...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Request Owner</TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount (Company Currency)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No pending approvals
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingExpenses.map((expense) => {
                      const isActioned = actedExpenses.has(expense.id)
                      return (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">{expense.description}</TableCell>
                          <TableCell>{expense.submittedBy?.name}</TableCell>
                          <TableCell className="capitalize text-sm text-muted-foreground">
                            {ruleMap[expense.id]?.name || '—'}
                          </TableCell>
                          <TableCell className="capitalize">{expense.category}</TableCell>
                          <TableCell>
                            {expense.baseCurrency || 'USD'} {expense.baseAmount?.toFixed(2) ?? expense.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">Pending</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-500 border-green-500/20"
                                onClick={() => handleAction(expense.id, "approve")}
                                disabled={isActioned}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive border-destructive/20"
                                onClick={() => handleAction(expense.id, "reject")}
                                disabled={isActioned}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedExpense && action && (
        <ApprovalDialog expenseId={selectedExpense} action={action} onClose={handleDialogClose} />
      )}
    </>
  )
}
