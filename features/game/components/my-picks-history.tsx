"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronDown, AlertCircle, RefreshCw, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getMyHistory } from "../apis/game-api"
import type { MyHistoryEntry } from "../apis/game-api"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtPct = (n: number | null) =>
  n == null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`

const fmtPrice = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n)

const cleanSymbol = (s: string) => s.replace(/\.[A-Z]+$/i, "")

function fmtDate(dateStr: string): { short: string; year: string } {
  const d = new Date(dateStr + "T00:00:00")
  const short = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  const year = d.getFullYear().toString()
  return { short, year }
}

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-white/[0.07] bg-[#111318] p-4">
      <div className="flex items-center gap-3">
        <div className="shrink-0 space-y-1.5">
          <div className="h-4 w-10 rounded bg-white/10" />
          <div className="h-3 w-8 rounded bg-white/[0.06]" />
        </div>
        <div className="flex flex-1 flex-wrap gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-5 w-16 rounded-full bg-white/10" />
          ))}
        </div>
        <div className="h-6 w-24 shrink-0 rounded-full bg-white/10" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Excess return badge
// ---------------------------------------------------------------------------

function ExcessBadge({ excess, pending }: { excess: number | null; pending: boolean }) {
  if (pending) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-medium text-amber-400 ring-1 ring-amber-500/30">
        Pending
      </span>
    )
  }
  if (excess == null) return null

  if (excess > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/30">
        ▲ +{excess.toFixed(2)}% vs Nifty
      </span>
    )
  }
  if (excess < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[11px] font-medium text-red-400 ring-1 ring-red-500/30">
        ▼ {excess.toFixed(2)}% vs Nifty
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-white/[0.07] px-2.5 py-0.5 text-[11px] font-medium text-gray-400 ring-1 ring-white/10">
      = Matched Nifty
    </span>
  )
}

// ---------------------------------------------------------------------------
// History card
// ---------------------------------------------------------------------------

function HistoryCard({ entry }: { entry: MyHistoryEntry }) {
  const [expanded, setExpanded] = useState(false)
  const { short, year } = fmtDate(entry.contest_date)
  const pending = !entry.is_settled

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#111318] transition-colors hover:border-white/[0.12]">
      {/* ── Collapsed header ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        aria-expanded={expanded}
      >
        {/* Date */}
        <div className="w-10 shrink-0 text-center">
          <p className="text-sm font-bold leading-tight text-white">{short}</p>
          <p className="text-[10px] leading-tight text-gray-600">{year}</p>
        </div>

        {/* Stock chips */}
        <div className="flex min-w-0 flex-1 flex-wrap gap-1">
          {entry.stocks.map(s => (
            <span
              key={s.symbol}
              className="rounded-full bg-white/[0.07] px-2 py-0.5 font-mono text-[10px] font-medium text-gray-400"
            >
              {cleanSymbol(s.symbol)}
            </span>
          ))}
        </div>

        {/* Right side — badges */}
        <div className="flex shrink-0 items-center gap-2">
          <ExcessBadge excess={entry.excess_return_pct} pending={pending} />

          {entry.rank != null && (
            <span className="hidden rounded-full bg-indigo-600 px-2.5 py-0.5 text-[11px] font-bold text-white sm:inline-flex">
              #{entry.rank}
            </span>
          )}

          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </div>
      </button>

      {/* ── Expanded detail ───────────────────────────────────────────────── */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/[0.06] px-4 pb-4 pt-3 space-y-4">
            {/* Stock breakdown */}
            {/* Desktop table */}
            <table className="hidden w-full text-sm sm:table">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="pb-2 text-left text-xs font-medium text-gray-500">Stock</th>
                  <th className="pb-2 text-right text-xs font-medium text-gray-500">Entry Price</th>
                  <th className="pb-2 text-right text-xs font-medium text-gray-500">Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {entry.stocks.map(s => (
                  <tr key={s.symbol}>
                    <td className="py-2 font-mono text-xs font-medium text-gray-300">
                      {cleanSymbol(s.symbol)}
                    </td>
                    <td className="py-2 text-right text-xs text-gray-400">
                      {fmtPrice(s.entry_price)}
                    </td>
                    <td className="py-2 text-right text-xs font-semibold">
                      {s.return_pct == null ? (
                        <span className="text-gray-600">—</span>
                      ) : (
                        <span
                          className={cn(
                            s.return_pct >= 0 ? "text-emerald-400" : "text-red-400",
                          )}
                        >
                          {fmtPct(s.return_pct)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile vertical list */}
            <div className="space-y-2 sm:hidden">
              {entry.stocks.map(s => (
                <div
                  key={s.symbol}
                  className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2"
                >
                  <div>
                    <p className="font-mono text-xs font-semibold text-white">
                      {cleanSymbol(s.symbol)}
                    </p>
                    <p className="text-[10px] text-gray-500">{fmtPrice(s.entry_price)}</p>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      s.return_pct == null
                        ? "text-gray-600"
                        : s.return_pct >= 0
                        ? "text-emerald-400"
                        : "text-red-400",
                    )}
                  >
                    {fmtPct(s.return_pct)}
                  </span>
                </div>
              ))}
            </div>

            {/* Pending note */}
            {pending && (
              <p className="text-center text-[11px] text-amber-500/80">
                Results after market close (3:30 PM IST)
              </p>
            )}

            {/* Summary strip */}
            {!pending && (
              <div className="rounded-lg bg-white/[0.04] px-3 py-2.5 text-xs text-gray-400 space-y-1">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>
                    Portfolio:{" "}
                    <span
                      className={cn(
                        "font-semibold",
                        (entry.portfolio_return_pct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400",
                      )}
                    >
                      {fmtPct(entry.portfolio_return_pct)}
                    </span>
                  </span>
                  <span>
                    Nifty:{" "}
                    <span className="font-semibold text-gray-300">
                      {fmtPct(entry.nifty_return_pct)}
                    </span>
                  </span>
                  {entry.excess_return_pct != null && (
                    <span>
                      Beat by:{" "}
                      <span
                        className={cn(
                          "font-semibold",
                          entry.excess_return_pct >= 0 ? "text-emerald-400" : "text-red-400",
                        )}
                      >
                        {fmtPct(entry.excess_return_pct)}
                      </span>
                    </span>
                  )}
                </div>
                {entry.rank != null && (
                  <p className="text-[11px] text-gray-500">
                    Rank{" "}
                    <span className="font-bold text-indigo-400">#{entry.rank}</span>
                    {entry.total_participants ? ` of ${entry.total_participants} participants` : ""}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Limit options
// ---------------------------------------------------------------------------

const LIMIT_OPTIONS = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "All time", value: 365 },
] as const

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MyPicksHistory({ onPlayToday }: { onPlayToday?: () => void }) {
  const [limit, setLimit] = useState(30)
  const [history, setHistory] = useState<MyHistoryEntry[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (l: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyHistory(l)
      setHistory(data.history)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch(limit)
  }, [limit, fetch])

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value))
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
          <div className="h-7 w-28 animate-pulse rounded-lg bg-white/10" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-center">
        <AlertCircle className="h-6 w-6 text-red-400" />
        <p className="text-sm text-red-400">{error}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetch(limit)}
          className="gap-2 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      </div>
    )
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  if (history && history.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-white/[0.07] bg-[#111318] px-6 py-12 text-center">
        <CalendarDays className="h-10 w-10 text-gray-600" />
        <div>
          <p className="text-base font-semibold text-white">No picks yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Your contest history will appear here once you start playing.
          </p>
        </div>
        {onPlayToday && (
          <Button
            onClick={onPlayToday}
            className="mt-2 bg-[#22d3ee] text-black hover:bg-[#06b6d4]"
          >
            Play Today&apos;s Contest →
          </Button>
        )}
      </div>
    )
  }

  // ── Data ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Controls strip */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Showing last {LIMIT_OPTIONS.find(o => o.value === limit)?.label.toLowerCase() ?? `${limit} days`}
        </p>
        <select
          value={limit}
          onChange={handleLimitChange}
          className="rounded-lg border border-white/[0.07] bg-[#111318] px-2.5 py-1 text-xs text-gray-300 outline-none focus:border-[#22d3ee]/40"
        >
          {LIMIT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Card list */}
      {history?.map(entry => (
        <HistoryCard key={entry.contest_date} entry={entry} />
      ))}
    </div>
  )
}
