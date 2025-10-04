"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useUsers } from "@/hooks/use-users"

interface AddUserDialogProps {
  onClose: () => void
  onUserAdded: () => void
}

export function AddUserDialog({ onClose, onUserAdded }: AddUserDialogProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"admin" | "manager" | "employee">("employee")
  const [department, setDepartment] = useState("")
  const [sendInvitation, setSendInvitation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { addUser } = useUsers()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const userData = {
        name,
        email,
        role,
        department: department || undefined,
        ...(sendInvitation ? {} : { password }),
        sendInvitation,
      }

      const result = await addUser(userData)
      
      if (result.success) {
        toast({
          title: "User added",
          description: result.message || `${name} has been added successfully.`,
        })
        onUserAdded()
        onClose()
      } else {
        toast({
          title: "Failed to add user",
          description: result.message || "Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to add user",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Create a new user account and assign a role.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@company.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value: any) => setRole(value)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department (Optional)</Label>
              <Input 
                id="department" 
                value={department} 
                onChange={(e) => setDepartment(e.target.value)} 
                placeholder="Engineering, Sales, etc." 
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sendInvitation" 
                checked={sendInvitation}
                onCheckedChange={(checked) => setSendInvitation(checked as boolean)}
              />
              <Label htmlFor="sendInvitation" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Send invitation email instead of creating password
              </Label>
            </div>
            {!sendInvitation && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : sendInvitation ? "Add & Send Invitation" : "Add User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
