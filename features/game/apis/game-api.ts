import { apiClient } from "@/lib/api/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GameStatus {
  contest_date: string
  active_contest_date?: string
  phase?: "open" | "submitted" | "settled"
  has_submitted: boolean
  is_settled: boolean
  total_participants: number
}

export interface SubmitPicksRequest {
  stocks: string[]
}

export interface SubmitPicksResponse {
  pick_id: string
  contest_date: string
  stocks: string[]
  message: string
}

export interface StockResult {
  symbol: string
  return_pct: number
}

export interface MyResult {
  contest_date: string
  stocks: StockResult[]
  portfolio_return_pct: number
  nifty_return_pct: number
  excess_return_pct: number
  rank: number
  total_participants: number
  is_settled: boolean
}

export interface LeaderboardEntry {
  rank: number
  user_id: string | null
  username: string | null
  display_name?: string | null
  anon_id?: string | null
  is_anonymous?: boolean
  stocks: string[]
  portfolio_return_pct: number | null
  excess_return_pct: number | null
}

export interface LeaderboardResponse {
  contest_date: string
  nifty_return_pct: number | null
  is_settled: boolean
  total_participants: number
  leaderboard: LeaderboardEntry[]
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export const getGameStatus = (contestDate?: string) => {
  const params = contestDate ? `?contest_date=${contestDate}` : ""
  return apiClient.request<GameStatus>(`/api/v1/game/status${params}`, { method: "GET" })
}

export const submitPicks = (body: SubmitPicksRequest) =>
  apiClient.request<SubmitPicksResponse>("/api/v1/game/picks", {
    method: "POST",
    body: JSON.stringify(body),
  })

export const getMyResult = (contestDate?: string) => {
  const params = contestDate ? `?contest_date=${contestDate}` : ""
  return apiClient.request<MyResult>(`/api/v1/game/my-result${params}`, { method: "GET" })
}

export const getLeaderboard = (contestDate?: string) => {
  const params = contestDate ? `?contest_date=${contestDate}` : ""
  return apiClient.request<LeaderboardResponse>(`/api/v1/game/leaderboard${params}`, { method: "GET" })
}

// ---------------------------------------------------------------------------
// Live performance
// ---------------------------------------------------------------------------

export interface VibeBlock {
  tier: "legendary" | "fire" | "winning" | "neck_and_neck" | "trailing" | "losing" | "crushed"
  emoji: string
  label: string
  vs_bar: number // -100 to +100
}

export interface LiveStockPerformance {
  symbol: string
  entry_price: number
  current_price: number | null
  return_pct: number | null
}

export interface LivePerformanceResponse {
  contest_date: string
  is_settled: boolean
  stocks: LiveStockPerformance[]
  portfolio_return_pct: number | null
  nifty_return_pct: number | null
  nifty_current_price: number | null
  excess_return_pct: number | null
  refreshed_at: string
  vibe: VibeBlock | null
}

export const getLivePerformance = () =>
  apiClient.request<LivePerformanceResponse>("/api/v1/game/live-performance", { method: "GET" })

// ---------------------------------------------------------------------------
// Anonymous game
// ---------------------------------------------------------------------------

export interface AnonSubmitPicksRequest {
  anon_id: string
  display_name: string
  stocks: string[]
}

// Same shape as GameStatus — reuse the type
export const submitAnonPicks = (body: AnonSubmitPicksRequest) =>
  apiClient.request<SubmitPicksResponse>("/api/v1/game/anon/picks", {
    method: "POST",
    body: JSON.stringify(body),
  })

export const getAnonStatus = (anonId: string, contestDate?: string) => {
  const params = new URLSearchParams({ anon_id: anonId })
  if (contestDate) params.set("contest_date", contestDate)
  return apiClient.request<GameStatus>(`/api/v1/game/anon/status?${params}`, { method: "GET" })
}

export const getAnonLivePerformance = (anonId: string) =>
  apiClient.request<LivePerformanceResponse>(
    `/api/v1/game/anon/live-performance?anon_id=${encodeURIComponent(anonId)}`,
    { method: "GET" },
  )

// ---------------------------------------------------------------------------
// Stock search
// ---------------------------------------------------------------------------

export interface StockSearchResult {
  symbol: string
  symbol_ns: string
  company_name: string
}

export interface StockSearchResponse {
  query: string
  results: StockSearchResult[]
}

export const searchGameStocks = (
  query: string,
  options?: { limit?: number; semantic?: boolean },
) => {
  const params = new URLSearchParams({
    q: query,
    limit: String(options?.limit ?? 10),
  })
  if (options?.semantic) params.set("semantic", "true")

  return apiClient.request<StockSearchResponse>(
    `/api/v1/game/stocks/search?${params.toString()}`,
    { method: "GET" },
  )
}

// ---------------------------------------------------------------------------
// My picks history
// ---------------------------------------------------------------------------

export interface MyHistoryStock {
  symbol: string
  entry_price: number
  return_pct: number | null
}

export interface MyHistoryEntry {
  contest_date: string
  is_settled: boolean
  stocks: MyHistoryStock[]
  portfolio_return_pct: number | null
  nifty_return_pct: number | null
  excess_return_pct: number | null
  rank: number | null
  total_participants?: number | null
}

export interface MyHistoryResponse {
  history: MyHistoryEntry[]
}

export const getMyHistory = (limit = 30) =>
  apiClient.request<MyHistoryResponse>(`/api/v1/game/my-history?limit=${limit}`, { method: "GET" })
