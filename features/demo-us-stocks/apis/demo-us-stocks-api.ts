import { apiClient } from "@/lib/api/client"

// ---------------------------------------------------------------------------
// Types — mirror src/api/schemas/demo_us_stocks.py
// ---------------------------------------------------------------------------

export interface SupportedSymbolsResponse {
  symbols: string[]
  window_seconds_options: number[]
  chart_window_options: ChartWindow[]
  default_symbol: string
  default_chart_window: ChartWindow
}

/** Chart windows the backend maps to a fixed granularity and source relation. */
export type ChartWindow = "1min" | "1h" | "1d" | "1mo"

export interface ChartBar {
  timestamp: string
  // NUMERIC columns arrive as JSON strings from FastAPI
  open: string
  high: string
  low: string
  close: string
  volume: number
}

export interface ChartResponse {
  symbol: string
  window: ChartWindow
  granularity: string
  data: ChartBar[]
}

export type AlertDirection = "up" | "down"

export interface AlertRule {
  id: string
  symbol: string
  window_seconds: number
  // NUMERIC columns arrive as JSON strings from FastAPI
  percentage_threshold: string
  direction: AlertDirection
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AlertRuleListResponse {
  rules: AlertRule[]
}

export interface CreateAlertRuleRequest {
  symbol: string
  window_seconds: number
  percentage_threshold: number
  direction: AlertDirection
}

export interface UpdateAlertRuleRequest {
  percentage_threshold?: number
  direction?: AlertDirection
  is_active?: boolean
}

export interface TriggeredAlert {
  id: string
  rule_id: string
  symbol: string
  window_start: string
  window_end: string
  opening_price: string
  closing_price: string
  percentage_change: string
  threshold_percentage: string
  message: string
  is_read: boolean
  triggered_at: string
}

export interface AlertListResponse {
  alerts: TriggeredAlert[]
  unread_count: number
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export const getSupportedSymbols = () =>
  apiClient.request<SupportedSymbolsResponse>("/api/v1/demo/us-stocks/symbols", {
    method: "GET",
  })

export const getStockChart = (symbol: string, window: ChartWindow) => {
  const params = new URLSearchParams({ symbol, window })
  return apiClient.request<ChartResponse>(
    `/api/v1/demo/us-stocks/chart?${params.toString()}`,
    { method: "GET" },
  )
}

export const getAlertRules = () =>
  apiClient.request<AlertRuleListResponse>("/api/v1/demo/us-stocks/alert-rules", {
    method: "GET",
  })

export const createAlertRule = (body: CreateAlertRuleRequest) =>
  apiClient.request<AlertRule>("/api/v1/demo/us-stocks/alert-rules", {
    method: "POST",
    body: JSON.stringify(body),
  })

export const updateAlertRule = (ruleId: string, body: UpdateAlertRuleRequest) =>
  apiClient.request<AlertRule>(
    `/api/v1/demo/us-stocks/alert-rules/${encodeURIComponent(ruleId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  )

export const deleteAlertRule = (ruleId: string) =>
  apiClient.request<void>(
    `/api/v1/demo/us-stocks/alert-rules/${encodeURIComponent(ruleId)}`,
    { method: "DELETE" },
  )

export const getAlerts = (options?: { limit?: number; unreadOnly?: boolean }) => {
  const params = new URLSearchParams({ limit: String(options?.limit ?? 50) })
  if (options?.unreadOnly) params.set("unread_only", "true")

  return apiClient.request<AlertListResponse>(
    `/api/v1/demo/us-stocks/alerts?${params.toString()}`,
    { method: "GET" },
  )
}

export const markAlertRead = (alertId: string) =>
  apiClient.request<TriggeredAlert>(
    `/api/v1/demo/us-stocks/alerts/${encodeURIComponent(alertId)}/read`,
    { method: "PATCH" },
  )

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/** 60 -> "1 minute", 300 -> "5 minutes". Matches the backend's phrasing. */
export const formatWindow = (windowSeconds: number): string => {
  const minutes = Math.round(windowSeconds / 60)
  return minutes === 1 ? "1 minute" : `${minutes} minutes`
}

/** "up" -> "up", used in rule summary copy. */
export const formatDirection = (direction: AlertDirection): string =>
  direction === "up" ? "up" : "down"

/** Drop trailing zeros from a NUMERIC string: "3.0000" -> "3", "2.5000" -> "2.5". */
export const formatPercentage = (value: string): string => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? String(parsed) : value
}

/** Signed, two-decimal percentage change: "3.4123" -> "+3.41". */
export const formatSignedPercentage = (value: string): string => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return value
  return `${parsed >= 0 ? "+" : ""}${parsed.toFixed(2)}`
}

/** Price string to a 2-decimal USD amount. */
export const formatPrice = (value: string): string => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? `$${parsed.toFixed(2)}` : value
}

/** Button labels for the chart window selector. */
export const CHART_WINDOW_LABELS: Record<ChartWindow, string> = {
  "1min": "1m",
  "1h": "1H",
  "1d": "1D",
  "1mo": "1M",
}

/**
 * How often to re-fetch each window. A 1-second granularity chart goes stale
 * almost immediately, while day bars barely move, so polling is tuned per
 * window rather than using one interval for all of them.
 */
export const CHART_REFRESH_MS: Record<ChartWindow, number> = {
  "1min": 5_000,
  "1h": 20_000,
  "1d": 60_000,
  "1mo": 120_000,
}
