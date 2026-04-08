import { apiClient } from "@/lib/api/client"

// ---------------------------------------------------------------------------
// Response types (mirror backend PortfolioResponse schema)
// ---------------------------------------------------------------------------

export interface PortfolioHoldingItem {
  id: string
  symbol: string
  company_name: string
  sector: string | null
  qty_available: number
  qty_long_term: number
  qty_pledged_margin: number
  avg_price: number
  ltp: number
  investment_value: number
  current_value: number
  pnl_absolute: number
  pnl_percent: number
  weight_percent: number
}

export interface PortfolioSummary {
  total_current_value: number
  total_investment_value: number
  total_pnl_absolute: number
  total_pnl_percent: number
}

export interface PortfolioResponse {
  user_broker_id: string
  broker_id: string
  broker_name: string
  last_updated_at: string
  uploaded_via: string
  summary: PortfolioSummary
  holdings: PortfolioHoldingItem[]
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export const getPortfolio = (userBrokerId: string) =>
  apiClient.request<PortfolioResponse>(
    `/api/v1/holdings/portfolio?user_broker_id=${userBrokerId}`,
    { method: "GET" },
  )
