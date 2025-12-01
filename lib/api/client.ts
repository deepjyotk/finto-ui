/**
 * API Client for Finto Backend
 * Auto-generated types based on openapi_spec.json
 */

// Get FastAPI base URL from environment or default to localhost
const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'

// ============================================================================
// Type Definitions (from OpenAPI spec)
// ============================================================================

// Thesys C1Chat Types (from OpenAPI spec)
export interface C1Message {
  content: string
}

export interface C1ChatRequest {
  message_payload: C1Message
  session_id: string
}

// Session Types (from OpenAPI spec)
export interface SessionItem {
  session_id: string
  started_at: string
}

export interface SessionResponse {
  session_id: string
  started_at: string
}

export interface SessionsListResponse {
  sessions: SessionItem[]
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
  ttl_minutes?: number
}

export interface ConnectIntentResponse {
  code: string
  deeplink: string
  expires_at: string
}

// Home Feed Types
export interface WhatsAppPayload {
  id: string
  user_e164: string
}

export interface ChatIntegration {
  whatsapp: WhatsAppPayload | null
}

export interface BrokerPayload {
  broker_id: string
  broker_name: string
  broker_type: string
  country: string
}

export interface HomeFeedSchema {
  chat_integrations: ChatIntegration[]
  available_brokers: BrokerPayload[]
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
   * POST /api/v1/auth/register
   */
  async register(data: UserCreate): Promise<UserResponse> {
    return this.request<UserResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   * JWT token is set in httpOnly cookie by backend
   */
  async login(data: UserLogin): Promise<UserResponse> {
    return this.request<UserResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   * Clears authentication cookie
   */
  async logout(): Promise<void> {
    return this.request<void>('/api/v1/auth/logout', {
      method: 'POST',
    })
  }

  /**
   * Get current authenticated user
   * GET /api/v1/auth/me
   */
  async getCurrentUser(): Promise<UserResponse> {
    return this.request<UserResponse>('/api/v1/auth/me', {
      method: 'GET',
    })
  }

  /**
   * Verify authentication status
   * GET /api/v1/auth/verify
   */
  async verifyAuth(): Promise<void> {
    return this.request<void>('/api/v1/auth/verify', {
      method: 'GET',
    })
  }

  // ============================================================================
  // Thesys Chat Endpoints
  // ============================================================================

  /**
   * Thesys C1 Chat endpoint URL
   * Used by the C1Chat component for streaming chat
   * The actual calls are handled by C1Chat internally via /api/thesys/chat proxy route
   */
  getThesysChatUrl(): string {
    return '/api/thesys/chat'
  }

  /**
   * Get all chat sessions for the authenticated user
   * GET /api/v1/thesys/session
   */
  async getSessions(): Promise<SessionsListResponse> {
    return this.request<SessionsListResponse>('/api/v1/thesys/session', {
      method: 'GET',
    })
  }

  /**
   * Create a new chat session
   * POST /api/v1/thesys/session
   */
  async createChatSession(): Promise<SessionResponse> {
    return this.request<SessionResponse>('/api/v1/thesys/session', {
      method: 'POST',
    })
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  /**
   * Health check endpoint
   * GET /healthz
   */
  async healthCheck(): Promise<any> {
    return this.request<any>('/healthz', {
      method: 'GET',
    })
  }

  // ============================================================================
  // Kite Connect v3 Endpoints (Backend proxy)
  // ============================================================================

  /**
   * Get login redirect URL and navigate browser to it.
   * GET /api/v1/kite/login -> 302 to Zerodha. Here we just return the URL so the caller can set window.location.
   */
  getKiteLoginUrl(): string {
    // NOTE: FastAPI endpoint returns a redirect. We fetch with redirect:'manual' when supported.
    // In the browser, fetch will follow redirects by default and we won't see the Location header.
    // Therefore, prefer opening the endpoint directly in the browser.
    // This method returns the backend URL to hit for login.
    return `${this.baseUrl}/api/v1/kite/login`
  }

  /**
   * Check whether current user has connected Kite account
   * GET /api/v1/kite/token -> { connected: boolean, session?: any }
   */
  async kiteTokenInfo(): Promise<{ connected: boolean; session?: any }> {
    return this.request<{ connected: boolean; session?: any }>(`/api/v1/kite/token`, {
      method: 'GET',
    })
  }

  /**
   * Public status - mostly for debugging
   * GET /api/v1/kite/status -> { connected: boolean, user_id: string }
   */
  async kiteStatus(): Promise<{ connected: boolean; user_id: string }> {
    return this.request<{ connected: boolean; user_id: string }>(`/api/v1/kite/status`, {
      method: 'GET',
    })
  }

  /**
   * Holdings endpoint via backend proxy to KiteConnect holdings().
   * GET /api/v1/kite/holdings -> Array of holdings
   */
  async kiteHoldings(): Promise<any> {
    // Backend may return { holdings: [...] } wrapper; keep type loose.
    return this.request<any>(`/api/v1/kite/holdings`, { method: 'GET' })
  }

  // ============================================================================
  // WhatsApp Connect Endpoints
  // ============================================================================

  /**
   * Create a WhatsApp connect intent
   * POST /api/v1/whatsapp/connect-intent
   */
  async createWhatsAppConnectIntent(data: ConnectIntentRequest): Promise<ConnectIntentResponse> {
    return this.request<ConnectIntentResponse>('/api/v1/whatsapp/connect-intent', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Delete a WhatsApp integration
   * DELETE /api/v1/whatsapp/{integration_id}
   */
  async deleteWhatsAppIntegration(integrationId: string): Promise<void> {
    return this.request<void>(`/api/v1/whatsapp/${integrationId}`, {
      method: 'DELETE',
    })
  }

  // ============================================================================
  // Home Feed Endpoints
  // ============================================================================

  /**
   * Get home feed with chat integrations and available brokers
   * GET /api/v1/home
   */
  async getHomeFeed(): Promise<HomeFeedSchema> {
    return this.request<HomeFeedSchema>('/api/v1/home', {
      method: 'GET',
    })
  }

  // ============================================================================
  // Holdings Endpoints
  // ============================================================================

  /**
   * Create a new equity holding
   * POST /api/v1/holdings
   */
  async createHolding(data: any): Promise<any> {
    return this.request<any>('/api/v1/holdings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Bulk upload equity holdings from file
   * POST /api/v1/holdings/file-upload
   */
  async uploadHoldingsFile(formData: FormData): Promise<any> {
    return this.request<any>('/api/v1/holdings/file-upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export class for testing or custom instances
export default ApiClient

