"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"

interface User {
  _id: string
  name: string
  email: string
  role: string
  department?: string
  isActive: boolean
  invitationToken?: string
  invitationExpires?: string
  createdAt: string
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  })

  const fetchUsers = async (params?: {
    page?: number
    limit?: number
    role?: string
    search?: string
  }) => {
    setIsLoading(true)
    try {
      const response = await apiClient.getUsers(params)
      if (response.success && response.data) {
        // Backend may return { users, pagination } or { data: [...] }
        const rawList = (response.data as any).users ?? (response.data as any).data ?? response.data
        const usersArray = Array.isArray(rawList) ? rawList : []
        setUsers(usersArray)
        setPagination((response.data as any).pagination ?? pagination)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addUser = async (userData: {
    name: string
    email: string
    password?: string
    role?: string
    department?: string
    manager?: string
    sendInvitation?: boolean
  }) => {
    try {
      const response = await apiClient.addUser(userData)
      if (response.success) {
        // Refresh users list
        await fetchUsers()
        return { success: true, message: response.message }
      }
      return { success: false, message: response.message || 'Failed to add user' }
    } catch (error) {
      console.error('Failed to add user:', error)
      return { success: false, message: error instanceof Error ? error.message : 'Failed to add user' }
    }
  }

  const updateUser = async (id: string, userData: {
    name?: string
    email?: string
    role?: string
    department?: string
    manager?: string
    isActive?: boolean
  }) => {
    try {
      const response = await apiClient.updateUser(id, userData)
      if (response.success) {
        // Refresh users list
        await fetchUsers()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to update user:', error)
      return false
    }
  }

  const deleteUser = async (id: string) => {
    try {
      const response = await apiClient.deleteUser(id)
      if (response.success) {
        // Refresh users list
        await fetchUsers()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to delete user:', error)
      return false
    }
  }

  const sendInvitation = async (userId: string) => {
    try {
      const response = await apiClient.sendInvitation(userId)
      if (response.success) {
        // Refresh users list to update invitation status
        await fetchUsers()
        return { success: true, message: response.message }
      }
      return { success: false, message: response.message || 'Failed to send invitation' }
    } catch (error) {
      console.error('Failed to send invitation:', error)
      return { success: false, message: error instanceof Error ? error.message : 'Failed to send invitation' }
    }
  }

  // Load users on mount
  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    isLoading,
    pagination,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser,
    sendInvitation,
  }
}
