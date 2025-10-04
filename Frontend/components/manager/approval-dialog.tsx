"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { apiClient, ApiResponse, ApprovalRuleData } from "../../lib/api"

interface ApprovalDialogProps {
  expenseId: string
  action: "approve" | "reject"
  onClose: (wasActioned: boolean) => void
}

export function ApprovalDialog({ expenseId, action, onClose }: ApprovalDialogProps) {
  const [comments, setComments] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rule, setRule] = useState<ApprovalRuleData['rule'] | undefined>(undefined)
  const { toast } = useToast()

  useEffect(() => {
    // Fetch applicable rule when dialog opens
    const fetchRule = async () => {
      try {
        const resp = await apiClient.getApplicableRule(expenseId)
        if (resp && resp.success) {
          setRule(resp.data?.rule)
        }
      } catch (err) {
        console.error('Failed to fetch rule:', err)
      }
    }
    fetchRule()
  }, [expenseId])

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      if (action === 'approve') {
        const resp = await apiClient.approveExpense(expenseId, comments || '')
        if (!resp || !resp.success) throw new Error(resp?.message || 'Approve failed')
      } else {
        const resp = await apiClient.rejectExpense(expenseId, comments || '', 'Rejected by manager')
        if (!resp || !resp.success) throw new Error(resp?.message || 'Reject failed')
      }

      toast({
        title: action === "approve" ? "Expense approved" : "Expense rejected",
        description: `The expense has been ${action === "approve" ? "approved" : "rejected"} successfully.`,
      })

      onClose(true)
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Failed to process the expense",
        variant: "destructive",
      })
      onClose(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action === "approve" ? "Approve Expense" : "Reject Expense"}</DialogTitle>
          <DialogDescription>
            {action === "approve"
              ? "Add optional comments for the employee."
              : "Please provide a reason for rejection."}
          </DialogDescription>
        </DialogHeader>
        
        {rule && (
          <div className="space-y-2 py-2 border-t">
            <p className="text-sm font-medium">Applied Approval Rule:</p>
            <p className="text-sm text-muted-foreground">{rule.name}</p>
            {rule.description && (
              <p className="text-sm text-muted-foreground">{rule.description}</p>
            )}
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="comments">Comments {action === "reject" && "(Required)"}</Label>
            <Textarea
              id="comments"
              placeholder={action === "approve" ? "Optional comments..." : "Reason for rejection..."}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={isSubmitting}
              required={action === "reject"}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || (action === "reject" && !comments.trim())}
          >
            {isSubmitting ? "Processing..." : action === "approve" ? "Approve" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
