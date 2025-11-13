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

// WhatsApp Connect Types
export interface ConnectIntentRequest {
  user_id: string
  ttl_minutes?: number
}

export interface ConnectIntentResponse {
  code: string
  deeplink: string
  expires_at: string
}

// ============================================================================
// API Client
// ============================================================================

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = FASTAPI_BASE_URL) {
    console.log('baseUrl', baseUrl)
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

  // ============================================================================
  // Kite Connect v3 Endpoints (Backend proxy)
  // ============================================================================

  /**
   * Get login redirect URL and navigate browser to it.
   * GET /kite/login -> 302 to Zerodha. Here we just return the URL so the caller can set window.location.
   */
  getKiteLoginUrl(): string {
    // NOTE: FastAPI endpoint returns a redirect. We fetch with redirect:'manual' when supported.
    // In the browser, fetch will follow redirects by default and we won't see the Location header.
    // Therefore, prefer opening the endpoint directly in the browser.
    // This method returns the backend URL to hit for login.
    return `${this.baseUrl}/kite/login`
  }

  /**
   * Check whether current user has connected Kite account
   * GET /kite/token -> { connected: boolean, session?: any }
   */
  async kiteTokenInfo(): Promise<{ connected: boolean; session?: any }> {
    return this.request<{ connected: boolean; session?: any }>(`/kite/token`, {
      method: 'GET',
    })
  }

  /**
   * Public status - mostly for debugging
   * GET /kite/status -> { connected: boolean, user_id: string }
   */
  async kiteStatus(): Promise<{ connected: boolean; user_id: string }> {
    return this.request<{ connected: boolean; user_id: string }>(`/kite/status`, {
      method: 'GET',
    })
  }

  /**
   * TODO: Portfolio endpoint
   * The backend snippet did not include a portfolio route. Once available (e.g. /kite/portfolio),
   * wire it here to fetch and return holdings/positions for the connected user.
   */
  // async kitePortfolio(): Promise<PortfolioResponse> {
  //   return this.request<PortfolioResponse>(`/kite/portfolio`, { method: 'GET' })
  // }

  /**
   * Holdings endpoint via backend proxy to KiteConnect holdings().
   * GET /kite/holdings -> Array of holdings
   * TODO: Confirm shape from backend and type this response.
   */
  async kiteHoldings(): Promise<any> {
    // Backend may return { holdings: [...] } wrapper; keep type loose.
    return this.request<any>(`/kite/holdings`, { method: 'GET' })
  }

  // ============================================================================
  // WhatsApp Connect Endpoints
  // ============================================================================

  /**
   * Create a WhatsApp connect intent
   * POST /api/whatsapp/connect-intent
   */
  async createWhatsAppConnectIntent(data: ConnectIntentRequest): Promise<ConnectIntentResponse> {
    return this.request<ConnectIntentResponse>('/api/whatsapp/connect-intent', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export class for testing or custom instances
export default ApiClient

