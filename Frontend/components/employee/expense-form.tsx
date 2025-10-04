"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useExpenses } from "@/hooks/use-expenses"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/hooks/use-currency"
import { useAuth } from "@/context/auth-context"

interface ExpenseFormProps {
  parsedData: {
    merchant: string | null
    amount: number | null
    currency: string | null
    date: string | null
    category: string
  } | null
  selectedFile?: File | null
  onSubmitSuccess: () => void
}

export function ExpenseForm({ parsedData, selectedFile, onSubmitSuccess }: ExpenseFormProps) {
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [date, setDate] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("")
  const [paidBy, setPaidBy] = useState("")
  const [receipt, setReceipt] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { submitExpense } = useExpenses()
  const { toast } = useToast()
  const { currencies } = useCurrency()
  const { user } = useAuth()

  // Set default currency to company's base currency
  useEffect(() => {
    if (user?.company?.baseCurrency) {
      setCurrency(user.company.baseCurrency)
    }
  }, [user])

  // Set form data from parsed receipt
  useEffect(() => {
    if (parsedData) {
      if (parsedData.merchant) {
        setPaidBy(parsedData.merchant)
        setDescription(`Expense at ${parsedData.merchant}`)
      }
      if (parsedData.amount !== null && parsedData.amount !== undefined) setAmount(parsedData.amount.toString())
      if (parsedData.date) setDate(parsedData.date)
      if (parsedData.category) setCategory(parsedData.category)
      if (parsedData.currency) setCurrency(parsedData.currency ?? '')
    }
  }, [parsedData])

  // Update receipt when parent provides a selected file (from UploadReceiptSection)
  useEffect(() => {
    if (selectedFile) {
      // Validate size
      if (selectedFile.size > 10 * 1024 * 1024) {
        // Inform user via toast and ignore the file
        setReceipt(null)
      } else {
        setReceipt(selectedFile)
      }
    }
  }, [selectedFile])

  const resetForm = () => {
    setDescription("")
    setCategory("")
    setDate("")
    setAmount("")
    setPaidBy("")
    setReceipt(null)
    // Reset to company's base currency
    if (user?.company?.baseCurrency) {
      setCurrency(user.company.baseCurrency)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Receipt file must be less than 10MB",
          variant: "destructive",
        })
        return
      }
      setReceipt(file)
    }
  }

  const validateForm = () => {
    if (!description.trim()) {
      toast({
        title: "Missing description",
        description: "Please enter a description for the expense.",
        variant: "destructive",
      })
      return false
    }

    if (!category) {
      toast({
        title: "Missing category",
        description: "Please select a category for the expense.",
        variant: "destructive",
      })
      return false
    }

    if (!date) {
      toast({
        title: "Missing date",
        description: "Please select the expense date.",
        variant: "destructive",
      })
      return false
    }

    const amountNum = Number(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid expense amount greater than 0.",
        variant: "destructive",
      })
      return false
    }

    if (!paidBy.trim()) {
      toast({
        title: "Missing payment method",
        description: "Please enter how the expense was paid.",
        variant: "destructive",
      })
      return false
    }

    if (!currency) {
      toast({
        title: "Missing currency",
        description: "Please select the expense currency.",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      const success = await submitExpense({
        description: description.trim(),
        category,
        date,
        amount: Number(amount),
        currency,
        paidBy: paidBy.trim(),
        receipt: receipt || undefined
      })

      if (success) {
        toast({
          title: "Success",
          description: "Your expense has been submitted for approval.",
        })
        resetForm()
        onSubmitSuccess()
      } else {
        throw new Error("Failed to submit expense")
      }
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Failed to submit expense. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = () => {
    toast({
      title: "Not available",
      description: "Draft functionality is not available in this version.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Details</CardTitle>
        <CardDescription>Fill in the expense information or edit auto-filled data</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the expense"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Expense Date</Label>
            <Input 
              id="date" 
              type="date" 
              value={date} 
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)} 
              required 
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Food">Food</SelectItem>
                <SelectItem value="Transport">Transport</SelectItem>
                <SelectItem value="Accommodation">Accommodation</SelectItem>
                <SelectItem value="Entertainment">Entertainment</SelectItem>
                <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                <SelectItem value="Travel">Travel</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidBy">Paid By</Label>
            <Input
              id="paidBy"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              placeholder="e.g., Personal Card, Company Card"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Total Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency} disabled={isSubmitting}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.code} ({curr.symbol}) - {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt">Receipt (Optional)</Label>
            <Input
              id="receipt"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
              disabled={isSubmitting}
            />
            {receipt && (
              <p className="text-sm text-muted-foreground">
                Selected: {receipt.name} ({(receipt.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              disabled={isSubmitting}
              onClick={handleSaveDraft}
            >
              Save as Draft
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="animate-pulse">Submitting...</span>
                </>
              ) : (
                "Submit Expense"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
