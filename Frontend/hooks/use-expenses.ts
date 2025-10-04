"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { apiClient } from "@/lib/api"

interface Expense {
  id: string; // Corrected from _id to id
  description: string
  category: string
  date: string
  amount: number
  originalAmount: number
  originalCurrency: string
  baseAmount: number
  baseCurrency: string
  exchangeRate: number
  paidBy: string
  currency: string; // Added missing property
  receipt?: {
    url: string
    publicId: string
    ocrData?: any
  }
  submittedBy: {
    _id: string
    name: string
    email: string
    department?: string
  }
  company: string
  status: "pending" | "approved" | "rejected" | "partially_approved"
  approvalWorkflow: {
    currentStep: number
    totalSteps: number
    approvers: Array<{
      user: {
        _id: string
        name: string
        email: string
        role: string
      }
      status: "pending" | "approved" | "rejected"
      comments: string
      approvedAt: string | null
    }>
    completedAt: string | null
  }
  rejectionReason?: string
  approvedBy?: {
    _id: string
    name: string
    email: string
  }
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  })
  const [lastError, setLastError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchExpenses = async (params?: {
    page?: number
    limit?: number
    status?: string
    category?: string
    startDate?: string
    endDate?: string
  }) => {
    if (!user) return

    setIsLoading(true)
    setLastError(null)
    try {
      let response
      if (user.role === 'admin') {
        response = await apiClient.getAllExpenses(params)
      } else if (user.role === 'manager') {
        response = await apiClient.getTeamExpenses(params)
      } else {
        response = await apiClient.getMyExpenses(params)
      }

      if (response.success && response.data) {
        // Normalize response shape: backend may return { expenses } or { data: [...] }
        const rawList = (response.data as any).expenses ?? (response.data as any).data ?? response.data
        const normalized = Array.isArray(rawList)
          ? rawList.map((e: any) => ({
              id: e._id || e.id,
              description: e.description,
              category: e.category,
              date: e.date,
              amount: typeof e.amount === 'number' ? e.amount : (e.baseAmount ?? e.originalAmount ?? 0),
              originalAmount: e.originalAmount ?? e.amount ?? 0,
              originalCurrency: e.originalCurrency ?? e.currency ?? e.baseCurrency ?? 'USD',
              baseAmount: e.baseAmount ?? e.amount ?? 0,
              baseCurrency: e.baseCurrency ?? e.currency ?? 'USD',
              exchangeRate: e.exchangeRate ?? 1,
              paidBy: e.paidBy ?? '',
              currency: e.currency ?? e.originalCurrency ?? e.baseCurrency ?? 'USD',
              receipt: e.receipt ?? e.receiptUrl ?? undefined,
              submittedBy: e.submittedBy,
              // Friendly employee name used across UI (manager view expects employeeName)
              employeeName: e.submittedBy?.name || e.employeeName || (e.submittedBy && (e.submittedBy.name || e.submittedBy.fullName)) || 'Unknown User',
              company: e.company,
              status: e.status || 'pending',
              approvalWorkflow: e.approvalWorkflow ?? {},
              rejectionReason: e.rejectionReason,
              approvedBy: e.approvedBy,
              approvedAt: e.approvedAt,
              createdAt: e.createdAt,
              updatedAt: e.updatedAt,
            }))
          : []

        setExpenses(normalized)
        // Pagination may be in response.data.pagination or response.data.pagination
        setPagination((response.data as any).pagination ?? pagination)
      }
    } catch (error) {
      setLastError(error instanceof Error ? error.message : String(error))
      console.error('Failed to fetch expenses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPendingApprovals = async (params?: {
    page?: number
    limit?: number
  }) => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) return

    setIsLoading(true)
    setLastError(null)
    try {
      const response = await apiClient.getPendingApprovals(params)
      if (response.success && response.data) {
        const rawList = (response.data as any).expenses ?? (response.data as any).data ?? response.data
        const normalized = Array.isArray(rawList)
          ? rawList.map((e: any) => ({
              id: e._id || e.id,
              description: e.description,
              category: e.category,
              date: e.date,
              amount: typeof e.amount === 'number' ? e.amount : (e.baseAmount ?? e.originalAmount ?? 0),
              originalAmount: e.originalAmount ?? e.amount ?? 0,
              originalCurrency: e.originalCurrency ?? e.currency ?? e.baseCurrency ?? 'USD',
              baseAmount: e.baseAmount ?? e.amount ?? 0,
              baseCurrency: e.baseCurrency ?? e.currency ?? 'USD',
              exchangeRate: e.exchangeRate ?? 1,
              paidBy: e.paidBy ?? '',
              currency: e.currency ?? e.originalCurrency ?? e.baseCurrency ?? 'USD',
              receipt: e.receipt ?? e.receiptUrl ?? undefined,
              submittedBy: e.submittedBy,
              employeeName: e.submittedBy?.name || e.employeeName || (e.submittedBy && (e.submittedBy.name || e.submittedBy.fullName)) || 'Unknown User',
              company: e.company,
              status: e.status || 'pending',
              approvalWorkflow: e.approvalWorkflow ?? {},
              rejectionReason: e.rejectionReason,
              approvedBy: e.approvedBy,
              approvedAt: e.approvedAt,
              createdAt: e.createdAt,
              updatedAt: e.updatedAt,
            }))
          : []

        setExpenses(normalized)
        setPagination((response.data as any).pagination ?? pagination)
      } else {
        // Ensure empty list is set
        setExpenses([])
      }
    } catch (error) {
      setLastError(error instanceof Error ? error.message : String(error))
      console.error('Failed to fetch pending approvals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const submitExpense = async (data: {
    description: string
    category: string
    date: string
    amount: number
    currency: string
    paidBy: string
    receipt?: File
  }): Promise<boolean> => {
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('description', data.description)
      formData.append('category', data.category)
      formData.append('date', data.date)
      formData.append('amount', data.amount.toString())
      formData.append('currency', data.currency)
      formData.append('paidBy', data.paidBy)
      
      if (data.receipt) {
        formData.append('receipt', data.receipt)
      }

      const response = await apiClient.submitExpense(formData)
      
      if (response.success) {
        await fetchExpenses()
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to submit expense:", error)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const approveExpense = async (expenseId: string, comments?: string): Promise<boolean> => {
    try {
      const response = await apiClient.approveExpense(expenseId, comments)
      if (response.success) {
        // Refresh expenses list
        await fetchExpenses()
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to approve expense:", error)
      return false
    }
  }

  const rejectExpense = async (expenseId: string, comments: string, reason?: string): Promise<boolean> => {
    try {
      const response = await apiClient.rejectExpense(expenseId, comments, reason)
      if (response.success) {
        // Refresh expenses list
        await fetchExpenses()
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to reject expense:", error)
      return false
    }
  }

  const getExpense = async (expenseId: string): Promise<Expense | null> => {
    try {
      const response = await apiClient.getExpense(expenseId) as { success: boolean; data?: { expense: Expense } }
      if (response.success && response.data) {
        return response.data.expense
      }
      return null
    } catch (error) {
      console.error("Failed to fetch expense:", error)
      return null
    }
  }

  // Load expenses on mount
  useEffect(() => {
    if (user) {
      if (user.role === 'manager') {
        // Managers should see pending approvals by default
        fetchPendingApprovals()
      } else {
        fetchExpenses()
      }
    }
  }, [user])

  return {
    expenses,
    isLoading,
    isSubmitting,
    pagination,
    fetchExpenses,
    fetchPendingApprovals,
    submitExpense,
    approveExpense,
    rejectExpense,
    getExpense,
    lastError,
  }
}
