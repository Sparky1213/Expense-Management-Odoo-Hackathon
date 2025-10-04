const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

interface PaginationInfo {
  current: number
  pages: number
  total: number
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationInfo
}

interface ApprovalRuleData {
  rule?: {
    _id: string
    name: string
    description?: string
    sequenceType: 'sequential' | 'parallel' | 'percentage' | 'any_one'
    minApprovalPercentage?: number
    approvers: Array<{
      user: {
        _id: string
        name: string
        email: string
        role: string
      }
      order: number
    }>
  }
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    // Merge headers but do not set Content-Type when body is FormData
    const incomingHeaders = (options.headers || {}) as HeadersInit
    const headers: HeadersInit = { ...incomingHeaders }

    // Only set Content-Type to application/json when body is not FormData and header not already provided
    const bodyIsFormData = options.body instanceof FormData
    if (!bodyIsFormData && !('Content-Type' in (headers as any))) {
      headers['Content-Type'] = 'application/json'
    }

    if (this.token) {
      (headers as Record<string, string>).Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Parse response conditionally based on content type
      const contentType = response.headers.get('content-type') || ''
      let data: any = null

      if (contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // Try to read as text when not JSON to avoid JSON parse errors
        const text = await response.text()
        // If response is JSON-like (sometimes servers omit header), attempt parsing
        try {
          data = text ? JSON.parse(text) : null
        } catch (err) {
          data = text
        }
      }

      if (!response.ok) {
        // If server returned JSON with message, prefer that
        const message = data && typeof data === 'object' ? data.message || data.error : data
        const err = new Error(message || `HTTP error! status: ${response.status}`)
        // Attach parsed response data for callers to inspect validation errors
        ;(err as any).responseData = data
        throw err
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async signup(name: string, email: string, password: string, currency: string) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, currency }),
    })
  }

  async getProfile() {
    return this.request('/auth/profile')
  }

  async updateProfile(name: string, department?: string) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, department }),
    })
  }

  // User management endpoints
  async getUsers(params?: {
    page?: number
    limit?: number
    role?: string
    search?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.role) searchParams.append('role', params.role)
    if (params?.search) searchParams.append('search', params.search)

    const queryString = searchParams.toString()
    return this.request<PaginatedResponse<any>>(`/users${queryString ? `?${queryString}` : ''}`)
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`)
  }

  async addUser(userData: {
    name: string
    email: string
    password?: string
    role?: string
    department?: string
    manager?: string
    sendInvitation?: boolean
  }) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async updateUser(id: string, userData: {
    name?: string
    email?: string
    role?: string
    department?: string
    manager?: string
    isActive?: boolean
  }) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    })
  }

  async getTeamMembers() {
    return this.request('/users/team')
  }

  async sendInvitation(userId: string) {
    return this.request(`/users/${userId}/send-invitation`, {
      method: 'POST',
    })
  }

  async acceptInvitation(token: string, password: string) {
    return this.request('/users/accept-invitation', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
  }

  // Expense endpoints
  async submitExpense(expenseData: FormData) {
    const headers: HeadersInit = {}
    if (this.token) headers.Authorization = `Bearer ${this.token}`
    
    // DO NOT set 'Content-Type' — browser sets boundary automatically
    return this.request('/expenses/submit', {
      method: 'POST',
      headers,
      body: expenseData
    })
  }
  

  async getMyExpenses(params?: {
    page?: number
    limit?: number
    status?: string
    category?: string
    startDate?: string
    endDate?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.status) searchParams.append('status', params.status)
    if (params?.category) searchParams.append('category', params.category)
    if (params?.startDate) searchParams.append('startDate', params.startDate)
    if (params?.endDate) searchParams.append('endDate', params.endDate)

    const queryString = searchParams.toString()
    return this.request<PaginatedResponse<any>>(`/expenses/my${queryString ? `?${queryString}` : ''}`)
  }

  async getAllExpenses(params?: {
    page?: number
    limit?: number
    status?: string
    category?: string
    department?: string
    startDate?: string
    endDate?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.status) searchParams.append('status', params.status)
    if (params?.category) searchParams.append('category', params.category)
    if (params?.department) searchParams.append('department', params.department)
    if (params?.startDate) searchParams.append('startDate', params.startDate)
    if (params?.endDate) searchParams.append('endDate', params.endDate)

    const queryString = searchParams.toString()
    return this.request<PaginatedResponse<any>>(`/expenses/all${queryString ? `?${queryString}` : ''}`)
  }

  async getPendingApprovals(params?: {
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())

    const queryString = searchParams.toString()
    return this.request<PaginatedResponse<any>>(`/expenses/pending${queryString ? `?${queryString}` : ''}`)
  }

  async getTeamExpenses(params?: {
    page?: number
    limit?: number
    status?: string
    category?: string
    startDate?: string
    endDate?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.status) searchParams.append('status', params.status)
    if (params?.category) searchParams.append('category', params.category)
    if (params?.startDate) searchParams.append('startDate', params.startDate)
    if (params?.endDate) searchParams.append('endDate', params.endDate)

    const queryString = searchParams.toString()
    return this.request<PaginatedResponse<any>>(`/expenses/team${queryString ? `?${queryString}` : ''}`)
  }

  async getExpense(id: string) {
    return this.request(`/expenses/${id}`)
  }

  async approveExpense(id: string, comments?: string) {
    return this.request(`/expenses/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ comments }),
    })
  }

  async rejectExpense(id: string, comments: string, reason?: string) {
    return this.request(`/expenses/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ comments, reason }),
    })
  }

  // Approval rules endpoints
  async createApprovalRule(ruleData: {
    name: string
    description?: string
    approvers: Array<{ user: string; order: number }>
    sequenceType?: string
    minApprovalPercentage?: number
    conditions?: any
    priority?: number
  }) {
    return this.request('/approvals/rules', {
      method: 'POST',
      body: JSON.stringify(ruleData),
    })
  }

  async getApprovalRules() {
    return this.request('/approvals/rules')
  }

  async updateApprovalRule(id: string, ruleData: any) {
    return this.request(`/approvals/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ruleData),
    })
  }

  async deleteApprovalRule(id: string) {
    return this.request(`/approvals/rules/${id}`, {
      method: 'DELETE',
    })
  }

  // Get the applicable approval rule for a specific expense
  async getApplicableRule(expenseId: string): Promise<ApiResponse<ApprovalRuleData>> {
    const qs = new URLSearchParams({ expenseId })
    return this.request(`/approvals/rules/applicable?${qs.toString()}`)
  }

  // OCR endpoints
  async parseReceipt(imageFile: File) {
    const formData = new FormData()
    formData.append('image', imageFile)

    const headers: HeadersInit = {}
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    return this.request('/ocr/parse', {
      method: 'POST',
      headers,
      body: formData,
    })
  }

  async extractText(imageFile: File) {
    const formData = new FormData()
    formData.append('image', imageFile)

    const headers: HeadersInit = {}
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    return this.request('/ocr/extract', {
      method: 'POST',
      headers,
      body: formData,
    })
  }

  // Currency endpoints
  async getSupportedCurrencies() {
    return this.request('/currency/supported')
  }

  async getCountriesAndCurrencies() {
    return this.request('/currency/countries')
  }

  // Update token when it changes
  updateToken(token: string | null) {
    this.token = token
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
export type { ApiResponse, PaginatedResponse, PaginationInfo, ApprovalRuleData }
