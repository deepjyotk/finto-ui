"use client"

import { FormEvent, useMemo, useState } from "react"
import { apiClient } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type DevPriceBarRow = {
  symbol: string
  company_name: string
  open: string | number | null
  high: string | number | null
  low: string | number | null
  close: string | number | null
  volume: number | null
}

type MetricDistribution = {
  n: number
  min: number | null
  max: number | null
  range: number | null
  mean: number | null
  median: number | null
  stddev: number | null
  p25: number | null
  p75: number | null
  p90: number | null
  p95: number | null
  p99: number | null
}

type FundamentalsStatsResponse = {
  pe: MetricDistribution
  peg: MetricDistribution
  pb: MetricDistribution
  ps: MetricDistribution
  roe_pct: MetricDistribution
  roic_pct: MetricDistribution
  operating_margin_pct: MetricDistribution
  revenue_growth_pct: MetricDistribution
  debt_to_equity: MetricDistribution
  interest_coverage: MetricDistribution
  current_ratio: MetricDistribution
  market_cap: MetricDistribution
}

const FUNDAMENTALS_ENDPOINT = "/api/v1/dev/query/fundamentals-stats"

const METRIC_ROWS: { key: keyof FundamentalsStatsResponse; label: string }[] = [
  { key: "pe", label: "P/E" },
  { key: "peg", label: "PEG" },
  { key: "pb", label: "P/B" },
  { key: "ps", label: "P/S (TTM)" },
  { key: "roe_pct", label: "ROE %" },
  { key: "roic_pct", label: "ROIC %" },
  { key: "operating_margin_pct", label: "Operating margin %" },
  { key: "revenue_growth_pct", label: "Revenue growth %" },
  { key: "debt_to_equity", label: "Debt / equity" },
  { key: "interest_coverage", label: "Interest coverage" },
  { key: "current_ratio", label: "Current ratio" },
  { key: "market_cap", label: "Market cap" },
]

const STAT_COLUMNS: { field: keyof MetricDistribution; header: string }[] = [
  { field: "n", header: "n" },
  { field: "min", header: "Min" },
  { field: "max", header: "Max" },
  { field: "range", header: "Range" },
  { field: "mean", header: "Mean" },
  { field: "median", header: "Median" },
  { field: "stddev", header: "Std dev" },
  { field: "p25", header: "p25" },
  { field: "p75", header: "p75" },
  { field: "p90", header: "p90" },
  { field: "p95", header: "p95" },
  { field: "p99", header: "p99" },
]

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function fmt(v: string | number | null): string {
  return v === null || v === undefined ? "-" : String(v)
}

function fmtStat(v: number | null): string {
  if (v === null || v === undefined) return "—"
  if (!Number.isFinite(v)) return "—"
  const ax = Math.abs(v)
  if (ax >= 1e12 || (ax > 0 && ax < 1e-6)) return v.toExponential(4)
  return v.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

export default function DevQueryPage() {
  const [symbol, setSymbol] = useState("RELIANCE")
  const [tradeDate, setTradeDate] = useState(todayIsoDate())
  const [row, setRow] = useState<DevPriceBarRow | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [priceError, setPriceError] = useState<string | null>(null)

  const [fundamentals, setFundamentals] = useState<FundamentalsStatsResponse | null>(null)
  const [fundamentalsLoading, setFundamentalsLoading] = useState(false)
  const [fundamentalsError, setFundamentalsError] = useState<string | null>(null)

  const endpoint = useMemo(() => {
    const q = new URLSearchParams({
      symbol: symbol.trim(),
      trade_date: tradeDate,
    })
    return `/api/v1/dev/query/price-bar?${q.toString()}`
  }, [symbol, tradeDate])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPriceLoading(true)
    setPriceError(null)
    setRow(null)

    try {
      const data = await apiClient.request<DevPriceBarRow | null>(endpoint, {
        method: "GET",
      })
      setRow(data)
      if (!data) {
        setPriceError("No row found for the given symbol and trade date.")
      }
    } catch (err) {
      setPriceError(err instanceof Error ? err.message : "Request failed")
    } finally {
      setPriceLoading(false)
    }
  }

  const loadFundamentals = async () => {
    setFundamentalsLoading(true)
    setFundamentalsError(null)
    setFundamentals(null)
    try {
      const data = await apiClient.request<FundamentalsStatsResponse>(FUNDAMENTALS_ENDPOINT, {
        method: "GET",
      })
      setFundamentals(data)
    } catch (err) {
      setFundamentalsError(err instanceof Error ? err.message : "Request failed")
    } finally {
      setFundamentalsLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6 text-white">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Dev helper</p>
        <h1 className="mt-1 text-2xl font-semibold">/dev/query</h1>
        <p className="mt-1 text-sm text-gray-400">
          Query one OHLCV row by joining <code>in_equities</code> and <code>price_bars_1d</code>, or load
          universe fundamentals distribution (screener-aligned metrics).
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-gray-200">Price bar</h2>
        <form onSubmit={onSubmit} className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end">
            <div className="space-y-1">
              <label htmlFor="symbol" className="text-sm text-gray-300">
                Symbol
              </label>
              <Input
                id="symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="RELIANCE"
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="trade-date" className="text-sm text-gray-300">
                Trade date
              </label>
              <Input
                id="trade-date"
                type="date"
                value={tradeDate}
                onChange={(e) => setTradeDate(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={priceLoading}>
              {priceLoading ? "Running..." : "Run query"}
            </Button>
          </div>
        </form>

        <div className="rounded-lg border border-white/10 bg-[#0F1419] p-4">
          <p className="mb-2 text-sm text-gray-400">Backend endpoint</p>
          <code className="block overflow-x-auto rounded bg-black/30 p-2 text-xs">{endpoint}</code>
        </div>

        {priceError ? <p className="text-sm text-amber-300">{priceError}</p> : null}

        {row ? (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/5 text-gray-300">
                <tr>
                  <th className="px-3 py-2">Symbol</th>
                  <th className="px-3 py-2">Company Name</th>
                  <th className="px-3 py-2">Open</th>
                  <th className="px-3 py-2">High</th>
                  <th className="px-3 py-2">Low</th>
                  <th className="px-3 py-2">Close</th>
                  <th className="px-3 py-2">Volume</th>
                  <th className="px-3 py-2">External websites</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-white/10">
                  <td className="px-3 py-2">{row.symbol}</td>
                  <td className="px-3 py-2">{row.company_name}</td>
                  <td className="px-3 py-2">{fmt(row.open)}</td>
                  <td className="px-3 py-2">{fmt(row.high)}</td>
                  <td className="px-3 py-2">{fmt(row.low)}</td>
                  <td className="px-3 py-2">{fmt(row.close)}</td>
                  <td className="px-3 py-2">{fmt(row.volume)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      <a
                        href="https://www.investing.com/equities"
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-300 hover:text-cyan-200 hover:underline"
                      >
                        investing.com
                      </a>
                      <a
                        href="https://www.nseindia.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-300 hover:text-cyan-200 hover:underline"
                      >
                        nseindia.com
                      </a>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-gray-200">Fundamentals distribution (universe)</h2>
        <p className="text-sm text-gray-400">
          Descriptive stats over <code>in_equities.company_metadata</code> plus statement-derived fields
          (same definitions as <code>screener_tool</code>).
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={loadFundamentals} disabled={fundamentalsLoading}>
            {fundamentalsLoading ? "Loading..." : "Load fundamentals stats"}
          </Button>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0F1419] p-4">
          <p className="mb-2 text-sm text-gray-400">Backend endpoint</p>
          <code className="block overflow-x-auto rounded bg-black/30 p-2 text-xs">{FUNDAMENTALS_ENDPOINT}</code>
        </div>
        {fundamentalsError ? <p className="text-sm text-amber-300">{fundamentalsError}</p> : null}
        {fundamentals ? (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-full text-left text-xs md:text-sm">
              <thead className="sticky top-0 bg-white/10 text-gray-200">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2">Metric</th>
                  {STAT_COLUMNS.map((c) => (
                    <th key={c.field} className="whitespace-nowrap px-2 py-2 text-right font-medium">
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRIC_ROWS.map(({ key, label }) => {
                  const m = fundamentals[key]
                  return (
                    <tr key={key} className="border-t border-white/10 hover:bg-white/[0.03]">
                      <td className="whitespace-nowrap px-3 py-2 text-gray-300">{label}</td>
                      {STAT_COLUMNS.map((c) => (
                        <td key={c.field} className="whitespace-nowrap px-2 py-2 text-right tabular-nums">
                          {c.field === "n" ? String(m[c.field]) : fmtStat(m[c.field])}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  )
}
