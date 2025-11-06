/**
 * API Client for Finto Backend
 * Auto-generated types based on openapi_spec.json
 */

// Get FastAPI base URL from environment or default to localhost
const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'

// ============================================================================
// Type Definitions (from OpenAPI spec)
// ============================================================================

export interface ChatRequest {
  message: string
  file?: string | null
  conversation_history?: string[]
}

export interface ChatResponse {
  response: string
}

export interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface HTTPValidationError {
  detail?: ValidationError[]
}

// Auth Types (from OpenAPI spec)
export interface UserCreate {
  username: string
  email: string
  full_name: string
  password: string
}

export interface UserLogin {
  username: string
  password: string
}

export interface UserResponse {
  username: string
  email: string
  full_name: string
  user_id: string
}

// ============================================================================
// API Client
// ============================================================================

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = FASTAPI_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Helper method to make authenticated requests
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      ...options,
      credentials: 'include', // Always include cookies for auth
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }

    const response = await fetch(url, config)
    const responseText = await response.text()

    if (!response.ok) {
      let errorMessage: string | undefined

      if (responseText) {
        try {
          const parsed = JSON.parse(responseText)
          errorMessage = parsed.detail || parsed.error || parsed.message
        } catch {
          errorMessage = responseText
        }
      }

      throw new Error(errorMessage || `HTTP ${response.status}: ${response.statusText}`)
    }

    if (!responseText.trim()) {
      return undefined as T
    }

    const contentType = response.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(responseText) as T
      } catch {
        throw new Error('Failed to parse JSON response')
      }
    }

    return responseText as unknown as T
  }

  // ============================================================================
  // Authentication Endpoints
  // ============================================================================

  /**
   * Register a new user
   * POST /auth/register
   */
  async register(data: UserCreate): Promise<UserResponse> {
    return this.request<UserResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Login user
   * POST /auth/login
   * JWT token is set in httpOnly cookie by backend
   */
  async login(data: UserLogin): Promise<UserResponse> {
    return this.request<UserResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Logout user
   * POST /auth/logout
   * Clears authentication cookie
   */
  async logout(): Promise<void> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
    })
  }

  /**
   * Get current authenticated user
   * GET /auth/me
   */
  async getCurrentUser(): Promise<UserResponse> {
    return this.request<UserResponse>('/auth/me', {
      method: 'GET',
    })
  }

  /**
   * Verify authentication status
   * GET /auth/verify
   */
  async verifyAuth(): Promise<void> {
    return this.request<void>('/auth/verify', {
      method: 'GET',
    })
  }

  // ============================================================================
  // Chat Endpoints
  // ============================================================================

  /**
   * Send a chat message
   * POST /chat
   */
  async chat(data: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  /**
   * Health check endpoint
   * GET /health
   */
  async healthCheck(): Promise<any> {
    return this.request<any>('/health', {
      method: 'GET',
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export class for testing or custom instances
export default ApiClient

