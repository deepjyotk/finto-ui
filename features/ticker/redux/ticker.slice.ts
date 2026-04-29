import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { TickerResponse, PricePeriod, PriceInterval } from "../types"
import { fetchTicker } from "./ticker.thunks"

// ── Logo ─────────────────────────────────────────────────────────────────────

export type LogoStatus = "idle" | "cdn" | "gcs" | "failed"

export interface LogoState {
  resolvedUrl: string | null
  status: LogoStatus
}

// ── Ticker data per symbol ────────────────────────────────────────────────────

export interface TickerDataState {
  data: TickerResponse | null
  loading: boolean
  error: string | null
  notFound: boolean
}

// ── Slice state ───────────────────────────────────────────────────────────────

export interface TickerState {
  /** Keyed by UPPER-CASE symbol */
  tickers: Record<string, TickerDataState>
  currentSymbol: string | null
  period: PricePeriod
  interval: PriceInterval
  /** Resolved logo per symbol — avoids re-probing on remount */
  logos: Record<string, LogoState>
}

const initialState: TickerState = {
  tickers: {},
  currentSymbol: null,
  period: "1y",
  interval: "1d",
  logos: {},
}

// ── Slice ─────────────────────────────────────────────────────────────────────

const tickerSlice = createSlice({
  name: "ticker",
  initialState,
  reducers: {
    setCurrentSymbol(state, action: PayloadAction<string>) {
      state.currentSymbol = action.payload
    },
    setPeriod(state, action: PayloadAction<PricePeriod>) {
      state.period = action.payload
    },
    setInterval(state, action: PayloadAction<PriceInterval>) {
      state.interval = action.payload
    },
    /** Seed store with SSR-fetched data so we skip the client-side fetch */
    hydrateTickerData(
      state,
      action: PayloadAction<{ symbol: string; data: TickerResponse }>,
    ) {
      const { symbol, data } = action.payload
      state.tickers[symbol] = { data, loading: false, error: null, notFound: false }
    },
    clearTickerError(state, action: PayloadAction<string>) {
      const entry = state.tickers[action.payload]
      if (entry) entry.error = null
    },
    /** Called by CompanyLogo once a working URL is confirmed */
    setLogoResolved(
      state,
      action: PayloadAction<{ symbol: string; url: string; source: "cdn" | "gcs" }>,
    ) {
      const { symbol, url, source } = action.payload
      state.logos[symbol] = { resolvedUrl: url, status: source }
    },
    /** Called by CompanyLogo when all sources fail */
    setLogoFailed(state, action: PayloadAction<string>) {
      state.logos[action.payload] = { resolvedUrl: null, status: "failed" }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTicker.pending, (state, { meta }) => {
        const { symbol } = meta.arg
        state.tickers[symbol] = {
          data: state.tickers[symbol]?.data ?? null,
          loading: true,
          error: null,
          notFound: false,
        }
      })
      .addCase(fetchTicker.fulfilled, (state, { payload }) => {
        const { symbol, data } = payload
        state.tickers[symbol] = { data, loading: false, error: null, notFound: false }
      })
      .addCase(fetchTicker.rejected, (state, { meta, error }) => {
        const { symbol } = meta.arg
        const msg = error.message ?? "Failed to load data"
        const notFound = msg.includes("404") || msg.toLowerCase().includes("not found")
        state.tickers[symbol] = {
          data: state.tickers[symbol]?.data ?? null,
          loading: false,
          error: notFound ? null : msg,
          notFound,
        }
      })
  },
})

export const {
  setCurrentSymbol,
  setPeriod,
  setInterval,
  hydrateTickerData,
  clearTickerError,
  setLogoResolved,
  setLogoFailed,
} = tickerSlice.actions

export const tickerReducer = tickerSlice.reducer
export default tickerSlice.reducer

// ── Selectors ─────────────────────────────────────────────────────────────────

import type { RootState } from "@/lib/store"

export const selectTickerEntry = (state: RootState, symbol: string): TickerDataState =>
  state.ticker.tickers[symbol] ?? { data: null, loading: false, error: null, notFound: false }

export const selectTickerData = (state: RootState, symbol: string) =>
  selectTickerEntry(state, symbol).data

export const selectTickerLoading = (state: RootState, symbol: string) =>
  selectTickerEntry(state, symbol).loading

export const selectTickerError = (state: RootState, symbol: string) =>
  selectTickerEntry(state, symbol).error

export const selectTickerNotFound = (state: RootState, symbol: string) =>
  selectTickerEntry(state, symbol).notFound

export const selectPeriod = (state: RootState) => state.ticker.period
export const selectInterval = (state: RootState) => state.ticker.interval

export const selectLogo = (state: RootState, symbol: string): LogoState | undefined =>
  state.ticker.logos[symbol]
