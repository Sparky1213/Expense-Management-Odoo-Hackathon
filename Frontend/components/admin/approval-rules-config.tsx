"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"

interface ApprovalRule {
  id: string
  name: string
  description: string
  manager: string
  approvers: string[]
  sequence: "sequential" | "all" | "any"
  percentage?: number
}

export function ApprovalRulesConfig() {
  const [rules, setRules] = useState<ApprovalRule[]>([])
  const [newRule, setNewRule] = useState<Partial<ApprovalRule>>({
    sequence: "sequential",
    approvers: [],
  })
  const [managers, setManagers] = useState<Array<{ _id: string; name: string }>>([])
  const { toast } = useToast()

  useEffect(() => {
    // Load rules from backend; fallback to localStorage
    const loadRules = async () => {
      try {
        const resp = await apiClient.getApprovalRules()
        if (resp.success && resp.data) {
          const raw = (resp.data as any).rules ?? (resp.data as any).data ?? resp.data
          const fetched = Array.isArray(raw) ? raw.map((r: any) => ({
            id: r._id || r.id,
            name: r.name,
            description: r.description,
            manager: r.approvers && r.approvers[0] ? (r.approvers[0].user?._id || r.approvers[0].user) : "",
            approvers: (r.approvers || []).map((a: any) => a.user?.name || a.user || ''),
            sequence: r.sequenceType || r.sequence || 'sequential',
            percentage: r.minApprovalPercentage
          })) : []

          if (fetched.length > 0) {
            setRules(fetched)
            return
          }
        }
      } catch (err) {
        console.error('Failed to fetch approval rules from API, falling back to localStorage:', err)
      }

      // Fallback to localStorage
      const stored = localStorage.getItem("approvalRules")
      if (stored) {
        setRules(JSON.parse(stored))
      } else {
        const defaultRules: ApprovalRule[] = []
        localStorage.setItem("approvalRules", JSON.stringify(defaultRules))
        setRules(defaultRules)
      }
    }

    // Fetch managers for the select options
    const fetchManagers = async () => {
      try {
        const resp = await apiClient.getUsers({ role: 'manager', limit: 100 })
        if (resp.success && resp.data) {
          // backend may return { users } or { data: [...] }
          const raw = (resp.data as any).users ?? (resp.data as any).data ?? resp.data
          const list = Array.isArray(raw) ? raw.map((u: any) => ({ _id: u._id || u.id, name: u.name })) : []
          setManagers(list)
        }
      } catch (err) {
        console.error('Failed to fetch managers:', err)
      }
    }

    loadRules()
    fetchManagers()
  }, [])

  // When managers load, auto-select first manager if none chosen and prefill approvers with manager name
  useEffect(() => {
    if (managers.length > 0) {
      setNewRule((prev) => {
        // If manager not set or previously set to placeholder, pick first manager
        const managerToUse = prev.manager && prev.manager !== '__no_managers' ? prev.manager : managers[0]._id
        const approvers = prev.approvers && prev.approvers.length > 0 ? prev.approvers : [managers[0].name]
        return { ...prev, manager: managerToUse, approvers }
      })
    }
  }, [managers])

  const handleAddRule = async () => {
    if (!newRule.name || !newRule.description || !newRule.manager || newRule.manager === '__no_managers' || !newRule.approvers?.length) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    // Build approvers payload for backend: map manager as first approver with order 1.
    // For this minimal implementation, we use the selected manager user id as the approver.
    const approversPayload = [
      { user: newRule.manager, order: 1 }
    ]

    try {
      // Build payload carefully: only include numeric fields if valid (avoid Infinity or null)
      const payload: any = {
        name: newRule.name,
        description: newRule.description,
        approvers: approversPayload,
        // map frontend sequence to backend sequenceType
        sequenceType: (function(seq: any) {
          if (seq === 'all') return 'parallel'
          if (seq === 'any') return 'any_one'
          return 'sequential'
        })(newRule.sequence),
        priority: (newRule as any).priority ?? 0,
      }

      if (typeof newRule.percentage === 'number') {
        payload.minApprovalPercentage = Number(newRule.percentage)
      }

      // Conditions: include only when provided and valid
      const conditions: any = {}
      const rawConditions = (newRule as any).conditions
      if (rawConditions) {
        if (rawConditions.minAmount !== undefined && rawConditions.minAmount !== null && !isNaN(Number(rawConditions.minAmount))) {
          conditions.minAmount = Number(rawConditions.minAmount)
        }
        if (rawConditions.maxAmount !== undefined && rawConditions.maxAmount !== null && isFinite(Number(rawConditions.maxAmount))) {
          conditions.maxAmount = Number(rawConditions.maxAmount)
        }
        if (Array.isArray(rawConditions.categories) && rawConditions.categories.length > 0) {
          conditions.categories = rawConditions.categories
        }
      }

      if (Object.keys(conditions).length > 0) {
        payload.conditions = conditions
      }

      const resp = await apiClient.createApprovalRule(payload)

      if (resp.success && resp.data) {
        // Use returned rule from server
        const r = resp.data.rule
        const saved = {
          id: r._id || r.id,
          name: r.name,
          description: r.description,
          manager: r.approvers && r.approvers[0] ? (r.approvers[0].user?._id || r.approvers[0].user) : newRule.manager,
          approvers: (r.approvers || []).map((a: any) => a.user?.name || a.user || ''),
          sequence: r.sequenceType || r.sequence || 'sequential',
          percentage: r.minApprovalPercentage
        }
        const updated = [...rules, saved]
        setRules(updated)
        // keep localStorage in sync
        localStorage.setItem("approvalRules", JSON.stringify(updated))

        toast({ title: 'Rule saved', description: 'Approval rule has been created and stored.' })

        // Reset form but keep first manager selected
        setNewRule({ sequence: 'sequential', manager: managers.length > 0 ? managers[0]._id : '', approvers: managers.length > 0 ? [managers[0].name] : [] })
        return
      }
    } catch (err: any) {
      // If API responded with validation errors, show them
      const serverData = err?.responseData || err?.response || null
      if (serverData && Array.isArray(serverData.errors) && serverData.errors.length > 0) {
        const msgs = serverData.errors.map((e: any) => e.msg || e.message).join('; ')
        toast({ title: 'Validation failed', description: msgs, variant: 'destructive' })
        console.debug('Create approval rule validation errors:', serverData.errors)
      } else {
        const serverMessage = err?.message || (err && String(err))
        toast({ title: 'Warning', description: serverMessage || 'Failed to persist rule to server. Saved locally instead.' })
        console.debug('Create approval rule error (server response):', serverMessage, serverData)
      }
    }

    // Fallback local save
    const rule: ApprovalRule = {
      id: Date.now().toString(),
      name: newRule.name as string,
      description: newRule.description as string,
      manager: newRule.manager || "",
      approvers: newRule.approvers as string[],
      sequence: newRule.sequence as 'sequential' | 'all' | 'any',
      percentage: newRule.percentage
    }

    const updated = [...rules, rule]
    localStorage.setItem("approvalRules", JSON.stringify(updated))
    setRules(updated)

    // Reset form but keep first manager preselected
    setNewRule({ sequence: "sequential", manager: managers.length > 0 ? managers[0]._id : "", approvers: managers.length > 0 ? [managers[0].name] : [] })

    toast({
      title: "Rule saved",
      description: "Approval rule has been created successfully (stored locally).",
    })
  }

  // Validate form before enabling Save
  const isFormValid = !!newRule.name && !!newRule.description && !!newRule.manager && newRule.manager !== '__no_managers' && Array.isArray(newRule.approvers) && newRule.approvers.length > 0

  const handleDeleteRule = (ruleId: string) => {
    const updated = rules.filter((r) => r.id !== ruleId)
    localStorage.setItem("approvalRules", JSON.stringify(updated))
    setRules(updated)

    toast({
      title: "Rule deleted",
      description: "Approval rule has been removed.",
    })
  }

  const handleAddApprover = () => {
    setNewRule({
      ...newRule,
      approvers: [...(newRule.approvers || []), ""],
    })
  }

  const handleUpdateApprover = (index: number, value: string) => {
    const updated = [...(newRule.approvers || [])]
    updated[index] = value
    setNewRule({ ...newRule, approvers: updated })
  }

  const handleRemoveApprover = (index: number) => {
    const updated = (newRule.approvers || []).filter((_, i) => i !== index)
    setNewRule({ ...newRule, approvers: updated })
  }

  const getSequenceLabel = (sequence: string) => {
    switch (sequence) {
      case "sequential":
        return "Sequential"
      case "all":
        return "All must approve"
      case "any":
        return "Any one can approve"
      default:
        return sequence
    }
  }

  return (
    <div className="space-y-6">
      {/* Existing Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Current Approval Rules</CardTitle>
          <CardDescription>Manage approval workflows for expense processing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No approval rules configured yet</p>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold">{rule.name}</h4>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Manager:</span>{" "}
                    <span className="font-medium">{managers.find(m => m._id === rule.manager)?.name || rule.manager}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sequence:</span>{" "}
                    <span className="font-medium">{getSequenceLabel(rule.sequence)}</span>
                  </div>
                  {rule.percentage && (
                    <div>
                      <span className="text-muted-foreground">Min Approval:</span>{" "}
                      <span className="font-medium">{rule.percentage}%</span>
                    </div>
                  )}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Approvers:</span>{" "}
                  <span className="font-medium">{rule.approvers.join(", ")}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Add New Rule */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Approval Rule</CardTitle>
          <CardDescription>Define a new approval workflow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ruleName">Rule Name</Label>
            <Input
              id="ruleName"
              value={newRule.name || ""}
              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              placeholder="e.g., Executive Approval"
            /> 
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newRule.description || ""}
              onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
              placeholder="Describe when this rule should be applied"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">Manager</Label>
            <Select value={newRule.manager || ""} onValueChange={(value) => setNewRule({ ...newRule, manager: value })}>
              <SelectTrigger id="manager">
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.length === 0 ? (
                  // Use a non-empty disabled value so Select.Item validation passes
                  <SelectItem value="__no_managers" disabled>No managers found</SelectItem>
                ) : (
                  managers.map((m) => (
                    <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Approvers (Multi-select)</Label>
              <Button type="button" size="sm" variant="outline" onClick={handleAddApprover}>
                <Plus className="h-4 w-4 mr-1" />
                Add Approver
              </Button>
            </div>
            <div className="space-y-2">
              {(newRule.approvers || []).map((approver, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={approver}
                    onChange={(e) => handleUpdateApprover(index, e.target.value)}
                    placeholder="e.g., Manager, CFO, Director"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleRemoveApprover(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Approval Sequence</Label>
            <RadioGroup
              value={newRule.sequence}
              onValueChange={(value: any) => setNewRule({ ...newRule, sequence: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sequential" id="sequential" />
                <Label htmlFor="sequential" className="font-normal cursor-pointer">
                  Sequential (one after another)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="font-normal cursor-pointer">
                  All must approve
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="any" id="any" />
                <Label htmlFor="any" className="font-normal cursor-pointer">
                  Any one can approve
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="percentage">Minimum Approval % (optional)</Label>
            <Input
              id="percentage"
              type="number"
              min="1"
              max="100"
              value={newRule.percentage || ""}
              onChange={(e) => setNewRule({ ...newRule, percentage: Number.parseInt(e.target.value) })}
              placeholder="e.g., 60"
            />
          </div>

          <Button onClick={handleAddRule} className="w-full" disabled={!isFormValid}>
            Save Rule
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
