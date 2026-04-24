"use client"

import { useState, useEffect, useCallback } from "react"
import { ExternalLink, RefreshCw, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { getTicker } from "../api"
import type { TickerResponse, PricePeriod, PriceInterval } from "../types"
import CompanyNav from "./company-nav"
import SummaryCard from "./summary-card"
import PriceChart from "./price-chart"
import FinancialTable from "./financial-table"
import KeyRatiosCard from "./key-ratios-card"
import TickerSkeleton from "./ticker-skeleton"
import CompanyOverviewCard from "./company-overview-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

interface TickerClientProps {
  symbol: string
  initialData: TickerResponse | null
  initialPeriod: PricePeriod
  initialInterval: PriceInterval
}

export default function TickerClient({
  symbol,
  initialData,
  initialPeriod,
  initialInterval,
}: TickerClientProps) {
  const router = useRouter()
  const [data, setData] = useState<TickerResponse | null>(initialData)
  const [loading, setLoading] = useState(initialData === null)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [period, setPeriod] = useState<PricePeriod>(initialPeriod)
  const [interval] = useState<PriceInterval>(initialInterval)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = useCallback(
    async (p: PricePeriod, i: PriceInterval) => {
      setLoading(true)
      setError(null)
      setNotFound(false)
      try {
        const result = await getTicker(symbol, { price_period: p, price_interval: i })
        setData(result)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load data"
        if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
          setNotFound(true)
        } else {
          setError(msg)
        }
      } finally {
        setLoading(false)
      }
    },
    [symbol],
  )

  // Only fetch client-side if SSR returned no data
  useEffect(() => {
    if (!initialData) {
      void fetchData(period, interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePeriodChange = async (p: PricePeriod) => {
    setPeriod(p)
    await fetchData(p, interval)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim().toUpperCase()
    if (q) router.push(`/ticker/${q}`)
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-600">404</p>
          <p className="mt-2 text-lg font-semibold text-white">Symbol not found</p>
          <p className="mt-1 text-sm text-gray-500">
            &ldquo;{symbol}&rdquo; could not be found. Try another stock symbol.
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex w-full max-w-sm gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
            placeholder="e.g. INFY, TCS, HDFCBANK"
            className="bg-[#111318] border-white/10 text-white placeholder:text-gray-600"
          />
          <Button type="submit" className="gap-1 bg-[#22d3ee] text-black hover:bg-[#06b6d4]">
            <Search className="h-4 w-4" /> Go
          </Button>
        </form>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => void fetchData(period, interval)}
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    )
  }

  // ── Loading (no SSR data) ──────────────────────────────────────────────────
  if (loading && !data) {
    return <TickerSkeleton />
  }

  if (!data) return null

  const priceChange =
    data.price_history.length >= 2
      ? (() => {
          const prev = data.price_history[data.price_history.length - 2]?.close ?? null
          const curr = data.company.current_price
          if (prev == null || curr == null) return null
          return ((curr - prev) / prev) * 100
        })()
      : null

  const lastUpdated = data.price_history.at(-1)?.date ?? null

  return (
    <div className="relative min-h-full bg-[#0B0F14]">
      {/* Sticky nav */}
      <CompanyNav
        company={data.company}
        priceChange={priceChange}
        lastUpdated={lastUpdated}
      />

      {/* Stale/error banner when refetching after period change */}
      {error && data && (
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-400 mx-4 mt-3">
          <span>Could not refresh price data. Showing cached results.</span>
          <button onClick={() => void fetchData(period, interval)} className="underline">
            Retry
          </button>
        </div>
      )}

      <div className="mx-auto max-w-5xl space-y-8 px-4 pb-16 pt-4">
        {/* Summary */}
        <section id="top">
          <SummaryCard
            company={data.company}
            keyRatios={data.key_ratios}
            priceChange={priceChange}
            tickerInfo={data.ticker_info}
          />
        </section>

        {/* Chart */}
        <section id="chart">
          <PriceChart
            priceHistory={data.price_history}
            period={period}
            interval={interval}
            loading={loading}
            onPeriodChange={handlePeriodChange}
          />
        </section>

        {/* About — after chart for context, only when available */}
        {data.ticker_info && (
          <section id="overview">
            <CompanyOverviewCard info={data.ticker_info} />
          </section>
        )}

        {/* Quarterly Results */}
        {data.quarterly_pnl?.rows?.length ? (
          <section id="quarters">
            <FinancialTable statement={data.quarterly_pnl} title="Quarterly Results" />
          </section>
        ) : null}

        {/* Profit & Loss — annual */}
        <section id="profit-loss">
          {data.annual_pnl?.rows?.length ? (
            <FinancialTable statement={data.annual_pnl} title="Profit & Loss" />
          ) : (
            <div className="rounded-2xl border border-white/[0.07] bg-[#111318] px-6 py-8 text-center text-sm text-gray-500">
              Financial data not yet available for {data.company.company_name}.
            </div>
          )}
        </section>

        {/* Balance Sheet — annual only */}
        {data.annual_balance_sheet?.rows?.length ? (
          <section id="balance-sheet">
            <FinancialTable statement={data.annual_balance_sheet} title="Balance Sheet" />
          </section>
        ) : null}

        {/* Cash Flow — annual only */}
        {data.annual_cash_flow?.rows?.length ? (
          <section id="cash-flow">
            <FinancialTable statement={data.annual_cash_flow} title="Cash Flow" />
          </section>
        ) : null}

        {/* Key Ratios */}
        <section id="ratios">
          <KeyRatiosCard keyRatios={data.key_ratios} />
        </section>
      </div>
    </div>
  )
}
