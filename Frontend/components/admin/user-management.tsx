"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Mail, Edit, Trash2, Loader2 } from "lucide-react"
import { AddUserDialog } from "./add-user-dialog"
import { useToast } from "@/hooks/use-toast"
import { useUsers } from "@/hooks/use-users"

export function UserManagement() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [sendingInvitation, setSendingInvitation] = useState<string | null>(null)
  const { toast } = useToast()
  const { users, isLoading, deleteUser, sendInvitation } = useUsers()

  const handleDeleteUser = async (userId: string) => {
    const success = await deleteUser(userId)
    if (success) {
      toast({
        title: "User deleted",
        description: "User has been deactivated successfully",
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const handleSendInvitation = async (userId: string, email: string) => {
    setSendingInvitation(userId)
    try {
      const result = await sendInvitation(userId)
      if (result.success) {
        toast({
          title: "Invitation sent",
          description: `An invitation email has been sent to ${email}`,
        })
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to send invitation",
          variant: "destructive",
        })
      }
    } finally {
      setSendingInvitation(null)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20">Admin</Badge>
      case "manager":
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Manager</Badge>
      case "employee":
        return <Badge variant="secondary">Employee</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (user: any) => {
    if (!user.isActive) {
      return <Badge variant="outline" className="text-orange-600">Pending Invitation</Badge>
    }
    if (user.invitationToken && user.invitationExpires && new Date(user.invitationExpires) > new Date()) {
      return <Badge variant="outline" className="text-blue-600">Invited</Badge>
    }
    return <Badge variant="outline" className="text-green-600">Active</Badge>
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Add users and send invitations to join your company</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users && users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSendInvitation(user._id, user.email)}
                            disabled={sendingInvitation === user._id}
                            title="Send invitation email"
                          >
                            {sendingInvitation === user._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {showAddDialog && (
        <AddUserDialog 
          onClose={() => setShowAddDialog(false)} 
          onUserAdded={() => {
            setShowAddDialog(false)
            // The useUsers hook will automatically refresh the list
          }} 
        />
      )}
    </>
  )
}
