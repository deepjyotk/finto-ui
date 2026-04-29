import { createAsyncThunk } from "@reduxjs/toolkit"
import { getTicker } from "../api"
import type { TickerResponse, PricePeriod, PriceInterval } from "../types"

interface FetchTickerArg {
  symbol: string
  period?: PricePeriod
  interval?: PriceInterval
}

export const fetchTicker = createAsyncThunk<
  { symbol: string; data: TickerResponse },
  FetchTickerArg
>("ticker/fetchTicker", async ({ symbol, period = "1y", interval = "1d" }) => {
  const data = await getTicker(symbol, {
    price_period: period,
    price_interval: interval,
  })
  return { symbol, data }
})
