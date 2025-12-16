/**
 * Shared API client
 * - Browser: routes through /api/proxy to avoid cross-origin cookie issues
 * - Server: calls backend directly
 */

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";
const isBrowser = typeof window !== "undefined";

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = FASTAPI_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  private getRequestUrl(endpoint: string): string {
    // Browser: proxy through Next.js to keep cookies on same origin
    // Endpoint format: /api/v1/xxx -> proxy at /api/proxy/xxx
    if (isBrowser && endpoint.startsWith("/api/v1/")) {
      const proxyPath = endpoint.replace("/api/v1/", "/api/proxy/");
      return proxyPath;
    }
    // Server-side: call backend directly
    return `${this.baseUrl}${endpoint}`;
  }

  /**
   * Perform a typed request to the FastAPI backend.
   * - Always includes credentials for auth cookies
   * - Parses JSON when present, otherwise returns text
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.getRequestUrl(endpoint);

    const headers = new Headers(options.headers as HeadersInit | undefined);

    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const config: RequestInit = {
      ...options,
      credentials: "include",
      headers,
    };

    const response = await fetch(url, config);
    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage: string | undefined;

      if (responseText) {
        try {
          const parsed = JSON.parse(responseText);
          errorMessage = parsed.detail || parsed.error || parsed.message;
        } catch {
          errorMessage = responseText;
        }
      }

      throw new Error(errorMessage || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (!responseText.trim()) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      try {
        return JSON.parse(responseText) as T;
      } catch {
        throw new Error("Failed to parse JSON response");
      }
    }

    return responseText as unknown as T;
  }
  // ============================================================================
  // Kite Connect Endpoints
  // ============================================================================

  /**
   * Get current holdings
   * GET /api/v1/kite/holdings
   */
  async kiteHoldings(): Promise<any> {
    return this.request<any>(`/api/v1/kite/holdings`, { method: "GET" });
  }

  /**
   * Get current positions (day + net)
   * GET /api/v1/kite/positions
   */
  async kitePositions(): Promise<any> {
    return this.request<any>(`/api/v1/kite/positions`, { method: "GET" });
  }

  /**
   * Get orders for today
   * GET /api/v1/kite/orders
   */
  async kiteOrders(): Promise<any> {
    return this.request<any>(`/api/v1/kite/orders`, { method: "GET" });
  }

  /**
   * Get trades for today
   * GET /api/v1/kite/trades
   */
  async kiteTrades(): Promise<any> {
    return this.request<any>(`/api/v1/kite/trades`, { method: "GET" });
  }

  /**
   * Get quote (OHLC, depth, etc.) for one or more symbols
   * GET /api/v1/kite/quote?symbols=NSE:INFY,NSE:TCS
   */
  async kiteQuote(symbols: string | string[]): Promise<any> {
    const symbolStr = Array.isArray(symbols) ? symbols.join(",") : symbols;
    return this.request<any>(`/api/v1/kite/quote?symbols=${encodeURIComponent(symbolStr)}`, {
      method: "GET",
    });
  }

  /**
   * Get last traded price for one or more symbols
   * GET /api/v1/kite/ltp?symbols=NSE:INFY,NSE:TCS
   */
  async kiteLtp(symbols: string | string[]): Promise<any> {
    const symbolStr = Array.isArray(symbols) ? symbols.join(",") : symbols;
    return this.request<any>(`/api/v1/kite/ltp?symbols=${encodeURIComponent(symbolStr)}`, {
      method: "GET",
    });
  }

  /**
   * Get historical data (candles) for an instrument
   * GET /api/v1/kite/historical?instrument_token=...&interval=...&from=...&to=...
   */
  async kiteHistorical(
    instrumentToken: string | number,
    interval: string,
    from?: string,
    to?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      instrument_token: String(instrumentToken),
      interval,
      ...(from && { from }),
      ...(to && { to }),
    });
    return this.request<any>(`/api/v1/kite/historical?${params.toString()}`, {
      method: "GET",
    });
  }}

export const apiClient = new ApiClient();
