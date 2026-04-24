import { apiClient } from "@/lib/api/client"
import type { TickerResponse, PricePeriod, PriceInterval, PriceBar } from "./types"

export const getTicker = (
  symbol: string,
  opts?: {
    price_period?: PricePeriod
    price_interval?: PriceInterval
    annual_periods?: number
    quarterly_periods?: number
  },
) => {
  const params = new URLSearchParams({
    price_period: opts?.price_period ?? "1y",
    price_interval: opts?.price_interval ?? "1d",
    annual_periods: String(opts?.annual_periods ?? 10),
    quarterly_periods: String(opts?.quarterly_periods ?? 12),
  })
  return apiClient.request<TickerResponse>(
    `/api/v1/ticker/${encodeURIComponent(symbol)}?${params}`,
    { method: "GET" },
  )
}

export const getTickerPriceHistory = (
  symbol: string,
  period: PricePeriod,
  interval: PriceInterval,
) => {
  const params = new URLSearchParams({ price_period: period, price_interval: interval })
  return apiClient.request<{ price_history: PriceBar[] }>(
    `/api/v1/ticker/${encodeURIComponent(symbol)}/price?${params}`,
    { method: "GET" },
  )
}
