"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ReferenceLine,
} from "recharts"
import type { PriceBar, PricePeriod, PriceInterval } from "../types"

interface Props {
  priceHistory: PriceBar[]
  period: PricePeriod
  interval: PriceInterval
  loading: boolean
  onPeriodChange: (p: PricePeriod) => void
}

const PERIODS: { label: string; value: PricePeriod }[] = [
  { label: "1M", value: "1mo" },
  { label: "6M", value: "6mo" },
  { label: "1Y", value: "1y" },
  { label: "Max", value: "max" },
]

function fmtDate(dateStr: string, period: PricePeriod): string {
  const d = new Date(dateStr + "T00:00:00")
  if (period === "1mo") return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  if (period === "6mo") return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
}

function tickInterval(length: number): number {
  if (length <= 30) return 4
  if (length <= 90) return 10
  if (length <= 260) return 30
  if (length <= 780) return 60
  return 120
}

// Recharts doesn't natively support candlesticks — we simulate with floating bars
// Each "candle" is rendered as a stacked bar: [low→open] invisible + [open→close] colored + wick lines
function buildCandleData(bars: PriceBar[]) {
  return bars.map((b) => {
    const o = b.open ?? b.close ?? 0
    const c = b.close ?? b.open ?? 0
    const h = b.high ?? Math.max(o, c)
    const l = b.low ?? Math.min(o, c)
    const up = c >= o
    const bodyLow = Math.min(o, c)
    const bodyHigh = Math.max(o, c)
    return {
      date: b.date,
      close: b.close,
      volume: b.volume,
      // For the floating bar: base = low, invisible gap, body
      baseLine: l,
      bodyBase: bodyLow - l, // invisible lower stack
      bodySize: bodyHigh - bodyLow || 0.01,
      upperWick: h - bodyHigh,
      up,
      high: h,
      low: l,
      open: o,
    }
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CandleTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1f2e] px-3 py-2 text-xs">
      <p className="mb-1 font-semibold text-white">{d.date}</p>
      <p className="text-gray-400">O: <span className="tabular-nums text-white">{d.open?.toFixed(2)}</span></p>
      <p className="text-gray-400">H: <span className="tabular-nums text-emerald-400">{d.high?.toFixed(2)}</span></p>
      <p className="text-gray-400">L: <span className="tabular-nums text-red-400">{d.low?.toFixed(2)}</span></p>
      <p className="text-gray-400">C: <span className="tabular-nums text-white">{d.close?.toFixed(2)}</span></p>
      {d.volume && <p className="text-gray-400">Vol: <span className="tabular-nums text-gray-300">{(d.volume / 1e5).toFixed(2)}L</span></p>}
    </div>
  )
}

export default function PriceChart({ priceHistory, period, interval, loading, onPeriodChange }: Props) {
  const candleData = buildCandleData(priceHistory)
  const ticks = tickInterval(candleData.length)

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111318]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3">
        <span className="text-sm font-semibold text-white">Price Chart</span>
        <div className="flex items-center gap-1">
          {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-gray-500" />}
          <div className="flex rounded-lg border border-white/[0.07] bg-[#0B0F14] p-0.5 gap-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => onPeriodChange(p.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  period === p.value
                    ? "bg-[#22d3ee]/10 text-[#22d3ee]"
                    : "text-gray-500 hover:text-white",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">
        {priceHistory.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-600">No price data</div>
        ) : (
          <>
            {/* Main candle chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={candleData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={ticks}
                    tickFormatter={(v) => fmtDate(v as string, period)}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                    tickFormatter={(v: number) => "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  />
                  <Tooltip content={<CandleTooltip />} />

                  {/* Invisible base (low) */}
                  <Bar dataKey="baseLine" stackId="candle" fill="transparent" legendType="none" />
                  {/* Invisible lower wick gap */}
                  <Bar dataKey="bodyBase" stackId="candle" fill="transparent" legendType="none" />
                  {/* Colored candle body */}
                  <Bar
                    dataKey="bodySize"
                    stackId="candle"
                    legendType="none"
                    minPointSize={1}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    fill="#34d399"
                    // Color each bar individually via cell
                    // recharts renders fill prop per-bar via Cell; we override below
                    isAnimationActive={false}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    shape={(props: any) => {
                      const { x, y, width, height, payload } = props
                      const color = payload.up ? "#34d399" : "#f87171"
                      // Draw wick lines + body rect
                      const midX = x + width / 2
                      const bodyTop = y
                      const bodyBottom = y + height
                      // upper wick: from bodyTop up by upperWick pixels (scaled)
                      // We only have pixel coords for body; wick must be approximate
                      return (
                        <g>
                          {/* body */}
                          <rect x={x + 1} y={bodyTop} width={Math.max(width - 2, 1)} height={Math.max(height, 1)} fill={color} rx={1} />
                        </g>
                      )
                    }}
                  />
                  {/* Closing price line overlay */}
                  <Line
                    dataKey="close"
                    type="monotone"
                    stroke="#22d3ee"
                    strokeWidth={1.5}
                    dot={false}
                    legendType="none"
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Volume chart */}
            <div className="mt-2 h-16 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={candleData} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Bar
                    dataKey="volume"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    shape={(props: any) => {
                      const { x, y, width, height, payload } = props
                      const color = payload.up ? "rgba(52,211,153,0.35)" : "rgba(248,113,113,0.35)"
                      return <rect x={x} y={y} width={width} height={height} fill={color} />
                    }}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 text-right text-[10px] text-gray-700">Volume</p>
          </>
        )}
      </div>
    </div>
  )
}
