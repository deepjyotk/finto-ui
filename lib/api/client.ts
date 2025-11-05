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

export interface Token {
  access_token: string
  token_type: string
}

export interface AuthVerifyResponse {
  authenticated: boolean
  user?: UserResponse
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

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }))
      throw new Error(error.detail || error.error || 'API request failed')
    }

    return response.json()
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
  async login(data: UserLogin): Promise<Token> {
    return this.request<Token>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Logout user
   * POST /auth/logout
   * Clears authentication cookie
   */
  async logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/logout', {
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
  async verifyAuth(): Promise<AuthVerifyResponse> {
    return this.request<AuthVerifyResponse>('/auth/verify', {
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

