"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"

type Role = "admin" | "manager" | "employee"

interface Company {
  id: string
  name: string
  baseCurrency: string
}

interface User {
  id: string
  name: string
  email: string
  role: Role
  department?: string
  company: Company
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string, currency: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  updateProfile: (name: string, department?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored user session and token
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("token")
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
      // Verify token is still valid by fetching profile
      verifyToken()
    } else {
      setIsLoading(false)
    }
  }, [])

  const verifyToken = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setIsLoading(false)
        return
      }

      // Update API client token
      apiClient.updateToken(token)

      const response = await apiClient.getProfile()
      
      if (response.success && response.data) {
        setUser(response.data.user)
        localStorage.setItem("user", JSON.stringify(response.data.user))
      } else {
        // Token is invalid, clear storage
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        apiClient.updateToken(null)
        setUser(null)
      }
    } catch (error) {
      console.error("Token verification failed:", error)
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      apiClient.updateToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      // If server responded with validation errors or failed flag, surface the message(s)
      if (!response.ok || !data.success) {
        // Prefer explicit message, otherwise present validation errors if present
        const serverMessage = data?.message
        let validationMessage: string | undefined = serverMessage

        if (!validationMessage && Array.isArray(data?.errors) && data.errors.length > 0) {
          validationMessage = data.errors.map((e: any) => e.msg || e.message).join('; ')
        }

        throw new Error(validationMessage || 'Invalid credentials. Please check your email and password.')
      }

      const { user: userData, token } = data.data
      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("token", token)
      
      // Update API client token
      apiClient.updateToken(token)

      // Redirect based on role
      router.push(`/dashboard/${userData.role}`)
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string, currency: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, currency })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed')
      }

      const { user: userData, token } = data.data
      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("token", token)
      
      // Update API client token
      apiClient.updateToken(token)

      // Redirect to admin dashboard
      router.push("/dashboard/admin")
    } catch (error) {
      console.error("Signup failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (name: string, department?: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, department })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed')
      }

      const updatedUser = data.data.user
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    } catch (error) {
      console.error("Profile update failed:", error)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    apiClient.updateToken(null)
    router.push("/")
  }

  return <AuthContext.Provider value={{ user, login, signup, logout, isLoading, updateProfile }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
