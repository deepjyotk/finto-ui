"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "@/lib/utils"
import {
  CHART_REFRESH_MS,
  CHART_WINDOW_LABELS,
  getStockChart,
  type ChartBar,
  type ChartWindow,
} from "@/features/demo-us-stocks/apis/demo-us-stocks-api"

/*
 * US stock chart for the Alerts page. Visually mirrors the Indian ticker chart
 * (features/ticker/components/price-chart.tsx) but is a separate component with
 * its own USD and intraday-time formatting, so nothing under /ticker/* is
 * affected by changes here.
 */

interface Props {
  symbols: string[]
  defaultSymbol: string
  defaultWindow: ChartWindow
  windowOptions: ChartWindow[]
}

const LINE_COLOR = "#22d3ee"
const GRADIENT_ID = "demoUsStockAreaGradient"

// ── helpers ────────────────────────────────────────────────────────────────

function fmtAxisTime(iso: string, chartWindow: ChartWindow): string {
  const d = new Date(iso)
  if (chartWindow === "1mo") {
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short" })
  }
  if (chartWindow === "1min") {
    return d.toLocaleTimeString("en-US", {
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function fmtTooltipTime(iso: string, chartWindow: ChartWindow): string {
  const d = new Date(iso)
  if (chartWindow === "1mo") {
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }
  return d.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: chartWindow === "1min" ? "2-digit" : undefined,
    hour12: false,
  })
}

function fmtPrice(v: number): string {
  return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

function fmtVolume(v: number): string {
  if (v >= 1e6) return (v / 1e6).toFixed(2) + "M"
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K"
  return String(v)
}

/** Keep the x-axis readable regardless of how many buckets came back. */
function tickInterval(length: number): number {
  if (length <= 12) return 0
  return Math.max(Math.floor(length / 8), 1)
}

// ── chart data shape ───────────────────────────────────────────────────────

interface ChartPoint {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  up: boolean
}

function buildChartData(bars: ChartBar[]): ChartPoint[] {
  return bars.map((b) => {
    const open = Number(b.open)
    const close = Number(b.close)
    return {
      timestamp: b.timestamp,
      open,
      high: Number(b.high),
      low: Number(b.low),
      close,
      volume: Number(b.volume),
      up: close >= open,
    }
  })
}

// ── tooltip ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, chartWindow }: any) {
  if (!active || !payload?.length) return null
  const d: ChartPoint | undefined = payload[0]?.payload
  if (!d) return null

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/95 px-3 py-2.5 text-xs shadow-2xl backdrop-blur-sm">
      <p className="mb-2 font-semibold tracking-wide text-gray-300">
        {fmtTooltipTime(d.timestamp, chartWindow)}
      </p>
      <div className="space-y-1">
        <Row label="O" value={d.open.toFixed(2)} />
        <Row label="H" value={d.high.toFixed(2)} color="text-emerald-400" />
        <Row label="L" value={d.low.toFixed(2)} color="text-red-400" />
        <Row
          label="C"
          value={d.close.toFixed(2)}
          color={d.up ? "text-emerald-400" : "text-red-400"}
          bold
        />
        <div className="my-1.5 border-t border-white/5" />
        <Row label="Vol" value={fmtVolume(d.volume)} color="text-gray-400" />
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  color = "text-white",
  bold,
}: {
  label: string
  value: string
  color?: string
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-5">
      <span className="text-gray-500">{label}</span>
      <span className={cn("tabular-nums", bold && "font-semibold", color)}>
        {value}
      </span>
    </div>
  )
}

// ── volume bar shape ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function VolumeBar(props: any) {
  const { x, y, width, height, payload } = props
  const fill = payload.up ? "rgba(34,211,238,0.28)" : "rgba(248,113,113,0.28)"
  return (
    <rect
      x={x}
      y={y}
      width={Math.max(width - 0.5, 0.5)}
      height={height}
      fill={fill}
      rx={1}
    />
  )
}

// ── component ──────────────────────────────────────────────────────────────

export function DemoUsStockPriceChart({
  symbols,
  defaultSymbol,
  defaultWindow,
  windowOptions,
}: Props) {
  const [symbol, setSymbol] = useState(defaultSymbol)
  const [chartWindow, setChartWindow] = useState<ChartWindow>(defaultWindow)
  const [bars, setBars] = useState<ChartBar[]>([])
  const [granularity, setGranularity] = useState("")
  // Only the first load blanks the chart; polls refresh in place so the chart
  // does not flash on every interval.
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lets an in-flight request discard its result once the selection moved on.
  const requestRef = useRef(0)

  const load = useCallback(
    async (nextSymbol: string, nextWindow: ChartWindow, initial: boolean) => {
      const requestId = ++requestRef.current
      if (initial) setIsLoading(true)
      setIsFetching(true)
      try {
        const data = await getStockChart(nextSymbol, nextWindow)
        if (requestRef.current !== requestId) return
        setBars(data.data)
        setGranularity(data.granularity)
        setError(null)
      } catch (err) {
        if (requestRef.current !== requestId) return
        setError(err instanceof Error ? err.message : "Failed to load chart data")
      } finally {
        if (requestRef.current === requestId) {
          setIsFetching(false)
          setIsLoading(false)
        }
      }
    },
    [],
  )

  useEffect(() => {
    load(symbol, chartWindow, true)
    const timer = setInterval(
      () => load(symbol, chartWindow, false),
      CHART_REFRESH_MS[chartWindow],
    )
    return () => clearInterval(timer)
  }, [symbol, chartWindow, load])

  const data = buildChartData(bars)
  const first = data[0]
  const last = data[data.length - 1]
  const changePercent =
    first && last && first.open > 0
      ? ((last.close - first.open) / first.open) * 100
      : null

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111318]">
      {/* ── header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-3">
        <div className="flex items-center gap-3">
          <label htmlFor="demo-us-stock-symbol" className="sr-only">
            Stock symbol
          </label>
          <select
            id="demo-us-stock-symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="rounded-lg border border-white/[0.07] bg-[#0B0F14] px-2.5 py-1 text-sm font-semibold text-white outline-none focus:border-[#22d3ee]/50"
          >
            {symbols.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {last && (
            <span className="text-sm font-semibold tabular-nums text-white">
              {fmtPrice(last.close)}
            </span>
          )}
          {changePercent !== null && (
            <span
              className={cn(
                "text-xs font-medium tabular-nums",
                changePercent >= 0 ? "text-emerald-500" : "text-red-500",
              )}
            >
              {changePercent >= 0 ? "▲" : "▼"} {Math.abs(changePercent).toFixed(2)}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isFetching && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-500" aria-hidden />
          )}
          <div
            className="flex gap-0.5 rounded-lg border border-white/[0.07] bg-[#0B0F14] p-0.5"
            role="group"
            aria-label="Chart window"
          >
            {windowOptions.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setChartWindow(w)}
                aria-pressed={chartWindow === w}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  chartWindow === w
                    ? "bg-[#22d3ee]/10 text-[#22d3ee]"
                    : "text-gray-500 hover:text-white",
                )}
              >
                {CHART_WINDOW_LABELS[w] ?? w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── body ── */}
      <div className="px-3 pb-4 pt-3">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading chart…
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-red-400">
            <AlertCircle className="h-5 w-5" aria-hidden />
            <p>{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-1 px-6 text-center text-sm text-gray-600">
            <p>No price data for {symbol} in this window.</p>
            <p className="text-xs text-gray-700">
              Live quotes will appear here once market data is available.
            </p>
          </div>
        ) : (
          /*
           * Tailwind overrides for Recharts internals:
           * – hide the default axis lines/tick lines (stroke is set via props)
           * – strip the border/outline Recharts adds to its wrapper div
           */
          <div className="[&_.recharts-cartesian-axis-line]:hidden [&_.recharts-cartesian-axis-tick-line]:hidden [&_.recharts-wrapper]:!border-0 [&_.recharts-wrapper]:!outline-none">
            <div className="h-[272px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={LINE_COLOR} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={LINE_COLOR} stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="timestamp"
                    tick={{ fill: "#4b5563", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={tickInterval(data.length)}
                    tickFormatter={(v) => fmtAxisTime(v as string, chartWindow)}
                    dy={6}
                  />

                  <YAxis
                    orientation="right"
                    domain={["auto", "auto"]}
                    tick={{ fill: "#4b5563", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={62}
                    tickFormatter={fmtPrice}
                  />

                  <Tooltip
                    content={<ChartTooltip chartWindow={chartWindow} />}
                    cursor={{
                      stroke: "rgba(255,255,255,0.08)",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke={LINE_COLOR}
                    strokeWidth={1.75}
                    fill={`url(#${GRADIENT_ID})`}
                    dot={false}
                    activeDot={{ r: 3.5, fill: LINE_COLOR, strokeWidth: 0 }}
                    connectNulls
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-1 h-14 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Bar dataKey="volume" isAnimationActive={false} shape={<VolumeBar />} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-1 flex items-center justify-between pr-[62px] text-[10px] tracking-wide text-gray-700">
              <span>{granularity ? `${granularity} bars` : ""}</span>
              <span>Volume</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
