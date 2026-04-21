"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { TrendingUp, TrendingDown, Minus, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { getLivePerformance, getAnonLivePerformance } from "../apis/game-api"
import type { LivePerformanceResponse, VibeBlock } from "../apis/game-api"
import RunnerCharacter from "./runner-character"

// ── helpers ────────────────────────────────────────────────────────────────

const cleanSymbol = (s: string) => s.replace(/\.NS$/i, "")

const fmtPct = (n: number | null | undefined) => {
  if (n == null) return null
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`
}

const fmtPrice = (n: number | null | undefined) => {
  if (n == null) return "—"
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function secondsAgo(isoStr: string): string {
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000)
  if (diff < 5) return "just now"
  if (diff < 60) return `${diff}s ago`
  const m = Math.floor(diff / 60)
  return `${m}m ago`
}

// ── Animated number ────────────────────────────────────────────────────────
// Smoothly interpolates a displayed number toward its target value.

function useAnimatedNumber(target: number | null, duration = 600): number | null {
  const [displayed, setDisplayed] = useState<number | null>(target)
  const prevRef = useRef<number | null>(target)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (target == null) {
      setDisplayed(null)
      prevRef.current = null
      return
    }
    const from = prevRef.current ?? target
    prevRef.current = target
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayed(from + (target - from) * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return displayed
}

// ── AnimatedPct display ────────────────────────────────────────────────────

function AnimatedPct({
  value,
  className,
}: {
  value: number | null
  className?: string
}) {
  const animated = useAnimatedNumber(value)
  if (animated == null) return <span className={cn("text-gray-600", className)}>—</span>
  const pos = animated >= 0
  return (
    <span
      className={cn(
        "tabular-nums transition-colors",
        pos ? "text-emerald-400" : "text-red-400",
        className,
      )}
    >
      {pos ? "+" : ""}
      {animated.toFixed(2)}%
    </span>
  )
}

// ── Live badge ─────────────────────────────────────────────────────────────

function LiveBadge({ settled }: { settled: boolean }) {
  if (settled) {
    return (
      <span className="rounded-full bg-[#22d3ee]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#22d3ee]">
        Final
      </span>
    )
  }
  return (
    <span className="relative inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      Live
    </span>
  )
}

// ── Vibe tug-of-war bar ────────────────────────────────────────────────────

const TIER_COLORS: Record<VibeBlock["tier"], { bg: string; glow: string; text: string }> = {
  legendary:     { bg: "bg-violet-500",  glow: "shadow-violet-500/40",  text: "text-violet-300" },
  fire:          { bg: "bg-orange-500",  glow: "shadow-orange-500/40",  text: "text-orange-300" },
  winning:       { bg: "bg-emerald-500", glow: "shadow-emerald-500/40", text: "text-emerald-300" },
  neck_and_neck: { bg: "bg-yellow-400",  glow: "shadow-yellow-400/40",  text: "text-yellow-300" },
  trailing:      { bg: "bg-amber-500",   glow: "shadow-amber-500/40",   text: "text-amber-300" },
  losing:        { bg: "bg-red-500",     glow: "shadow-red-500/40",     text: "text-red-300" },
  crushed:       { bg: "bg-rose-700",    glow: "shadow-rose-700/40",    text: "text-rose-300" },
}

function VibeBarBlock({ vibe }: { vibe: VibeBlock }) {
  const colors = TIER_COLORS[vibe.tier]
  // vs_bar: -100 = full left (Nifty winning), +100 = full right (you winning)
  // Thumb position as a % from left: 0% → 100%, center = 50%
  const thumbPct = Math.min(100, Math.max(0, (vibe.vs_bar + 100) / 2))

  return (
    <div className="space-y-2.5 rounded-2xl border border-white/[0.07] bg-[#111318] px-4 py-3.5">
      {/* Tier label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{vibe.emoji}</span>
          <span className={cn("text-sm font-bold", colors.text)}>{vibe.label}</span>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
          {vibe.tier.replace("_", " ")}
        </span>
      </div>

      {/* Tug-of-war bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-medium text-gray-600">
          <span>← Nifty winning</span>
          <span>You winning →</span>
        </div>

        {/* Track container — extra top padding so runner has vertical room */}
        <div className="relative pb-1 pt-10">
          {/* Runner — absolutely positioned above the track */}
          <div
            className="absolute top-0 transition-all duration-700 ease-out"
            style={{ left: `${thumbPct}%`, transform: "translateX(-50%)" }}
          >
            <RunnerCharacter
              size={36}
              color={vibe.tier === "legendary" ? "#a78bfa"
                : vibe.tier === "fire" ? "#fb923c"
                : vibe.tier === "winning" ? "#34d399"
                : vibe.tier === "neck_and_neck" ? "#facc15"
                : vibe.tier === "trailing" ? "#f59e0b"
                : vibe.tier === "losing" ? "#f87171"
                : "#fb7185"}
              flipped={vibe.vs_bar < 0}
              speed={1 + Math.abs(vibe.vs_bar) / 150}
              celebrate={vibe.tier === "legendary" || vibe.tier === "fire"}
            />
          </div>

          {/* Track */}
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            {/* Filled region from center to runner */}
            <div
              className={cn(
                "absolute top-0 h-full transition-all duration-700 ease-out opacity-30",
                colors.bg,
              )}
              style={
                thumbPct >= 50
                  ? { left: "50%", width: `${thumbPct - 50}%` }
                  : { left: `${thumbPct}%`, width: `${50 - thumbPct}%` }
              }
            />
            {/* Center divider */}
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-px bg-white/20" />
          </div>
        </div>

        {/* Center label */}
        <div className="text-center text-[10px] text-gray-700">
          Tied at 0%
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

const DEFAULT_POLL_INTERVAL = 1000_000

export default function LivePerformance({
  anonId,
  pollInterval = DEFAULT_POLL_INTERVAL,
}: {
  anonId?: string
  pollInterval?: number
}) {
  const [data, setData] = useState<LivePerformanceResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [tick, setTick] = useState(0) // forces re-render for "X seconds ago"
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPolling(false)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const result = anonId
        ? await getAnonLivePerformance(anonId)
        : await getLivePerformance()
      setData(result)
      setError(null)
      if (result.is_settled) stopPolling()
    } catch (err) {
      // 404 = no picks yet, treat as silent
      const msg = err instanceof Error ? err.message : "Failed to fetch live data"
      const is404 = msg.includes("404") || msg.toLowerCase().includes("no picks")
      setError(is404 ? null : msg)
      // Don't stop polling on transient errors — might recover
    }
  }, [stopPolling])

  // Initial fetch + start polling
  useEffect(() => {
    fetchData()
    setIsPolling(true)
    intervalRef.current = setInterval(fetchData, pollInterval)

    // Tick every second to keep "X seconds ago" fresh
    const tickInterval = setInterval(() => setTick(t => t + 1), 1000)

    return () => {
      stopPolling()
      clearInterval(tickInterval)
    }
  }, [fetchData, stopPolling, pollInterval])

  // Animated summary values
  const animPortfolio = useAnimatedNumber(data?.portfolio_return_pct ?? null)
  const animNifty = useAnimatedNumber(data?.nifty_return_pct ?? null)
  const animExcess = useAnimatedNumber(data?.excess_return_pct ?? null)

  // ── Error state (non-intrusive) ──────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-xs text-red-400">
        <WifiOff className="h-3.5 w-3.5 shrink-0" />
        <span>Live data unavailable — {error}</span>
      </div>
    )
  }

  // ── No data yet (404 / loading) ──────────────────────────────────────────
  if (!data) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const excessPos = (animExcess ?? 0) >= 0
  const excessNeutral = animExcess === 0

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LiveBadge settled={data.is_settled} />
          <span className="text-xs font-semibold text-white">Live Performance</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
          {isPolling && !data.is_settled ? (
            <RefreshCw className="h-3 w-3 animate-spin text-gray-600" />
          ) : (
            <Wifi className="h-3 w-3 text-gray-700" />
          )}
          {/* suppress tick lint warning — it's intentional to force re-render */}
          {/* eslint-disable-next-line @typescript-eslint/no-unused-expressions */}
          {void tick}
          Updated {secondsAgo(data.refreshed_at)}
        </div>
      </div>

      {/* Summary card */}
      <div
        className={cn(
          "grid grid-cols-3 gap-px overflow-hidden rounded-2xl border",
          excessNeutral
            ? "border-gray-600/30"
            : excessPos
            ? "border-emerald-500/20"
            : "border-red-500/20",
        )}
      >
        {/* Portfolio */}
        <div className="flex flex-col items-center gap-0.5 bg-[#111318] px-3 py-4">
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
            Portfolio
          </span>
          <span
            className={cn(
              "text-2xl font-extrabold tabular-nums",
              animPortfolio == null
                ? "text-gray-600"
                : (animPortfolio ?? 0) >= 0
                ? "text-emerald-400"
                : "text-red-400",
            )}
          >
            {animPortfolio == null ? "—" : `${(animPortfolio ?? 0) >= 0 ? "+" : ""}${(animPortfolio ?? 0).toFixed(2)}%`}
          </span>
        </div>

        {/* vs Nifty (centre — hero) */}
        <div
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-4",
            excessNeutral
              ? "bg-gray-800/40"
              : excessPos
              ? "bg-emerald-500/[0.08]"
              : "bg-red-500/[0.08]",
          )}
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
            vs Nifty
          </span>
          <div className="flex items-center gap-1">
            {excessNeutral ? (
              <Minus className="h-4 w-4 text-gray-400" />
            ) : excessPos ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400" />
            )}
            <span
              className={cn(
                "text-2xl font-extrabold tabular-nums",
                excessNeutral ? "text-gray-300" : excessPos ? "text-emerald-400" : "text-red-400",
              )}
            >
              {animExcess == null
                ? "—"
                : `${(animExcess ?? 0) >= 0 ? "+" : ""}${(animExcess ?? 0).toFixed(2)}%`}
            </span>
          </div>
          <span className="text-[10px] text-gray-600">
            {excessNeutral
              ? "Matched Nifty"
              : excessPos
              ? "Beating Nifty"
              : "Behind Nifty"}
          </span>
        </div>

        {/* Nifty benchmark */}
        <div className="flex flex-col items-center gap-0.5 bg-[#111318] px-3 py-4">
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
            Nifty 50
          </span>
          <span
            className={cn(
              "text-2xl font-extrabold tabular-nums",
              animNifty == null
                ? "text-gray-600"
                : (animNifty ?? 0) >= 0
                ? "text-emerald-400"
                : "text-red-400",
            )}
          >
            {animNifty == null ? "—" : `${(animNifty ?? 0) >= 0 ? "+" : ""}${(animNifty ?? 0).toFixed(2)}%`}
          </span>
          {data.nifty_current_price != null && (
            <span className="text-[10px] text-gray-600">
              {fmtPrice(data.nifty_current_price)}
            </span>
          )}
        </div>
      </div>

      {/* Vibe block */}
      {data.vibe && <VibeBarBlock vibe={data.vibe} />}

      {/* Per-stock table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-b border-white/[0.07] bg-[#1a1f2e] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          <span>Symbol</span>
          <span className="text-right">Entry</span>
          <span className="text-right">Current</span>
          <span className="text-right">Return</span>
        </div>

        {data.stocks.map((stock) => (
          <StockRow key={stock.symbol} stock={stock} />
        ))}
      </div>
    </div>
  )
}

// ── Per-stock row (isolated so each has its own animated number) ───────────

function StockRow({ stock }: { stock: import("../apis/game-api").LiveStockPerformance }) {
  const animReturn = useAnimatedNumber(stock.return_pct)
  const animCurrent = useAnimatedNumber(stock.current_price)

  const pos = (animReturn ?? 0) >= 0
  const isLoading = stock.return_pct == null || stock.current_price == null

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 border-b border-white/[0.04] bg-[#111318] px-4 py-2.5 text-sm last:border-0 hover:bg-[#1a1f2e]">
      {/* Symbol */}
      <span className="font-semibold text-white">{cleanSymbol(stock.symbol)}</span>

      {/* Entry price */}
      <span className="text-right text-xs text-gray-500">{fmtPrice(stock.entry_price)}</span>

      {/* Current price — animated */}
      {isLoading ? (
        <Skeleton className="h-4 w-16 rounded" />
      ) : (
        <span className="text-right text-xs font-medium text-gray-300">
          {animCurrent == null ? "—" : fmtPrice(animCurrent)}
        </span>
      )}

      {/* Return % — animated */}
      {isLoading ? (
        <Skeleton className="h-4 w-12 rounded" />
      ) : (
        <span
          className={cn(
            "text-right text-xs font-bold tabular-nums",
            pos ? "text-emerald-400" : "text-red-400",
          )}
        >
          {animReturn == null ? "—" : `${pos ? "+" : ""}${(animReturn).toFixed(2)}%`}
        </span>
      )}
    </div>
  )
}
