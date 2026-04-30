"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
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

const LINE_COLOR = "#22d3ee"
const GRADIENT_ID = "priceAreaGradient"

// ── helpers ────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string, period: PricePeriod): string {
  const d = new Date(dateStr + "T00:00:00")
  if (period === "1mo" || period === "6mo")
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
}

function tickInterval(length: number): number {
  if (length <= 30) return 4
  if (length <= 90) return 10
  if (length <= 260) return 30
  if (length <= 780) return 60
  return 120
}

function fmtPrice(v: number): string {
  return "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

// ── chart data shape ───────────────────────────────────────────────────────

interface ChartPoint {
  date: string
  close: number | null
  open: number | null
  high: number | null
  low: number | null
  volume: number | null
  up: boolean
}

function buildChartData(bars: PriceBar[]): ChartPoint[] {
  return bars.map((b) => ({
    date: b.date,
    close: b.close ?? null,
    open: b.open,
    high: b.high,
    low: b.low,
    volume: b.volume,
    up: (b.close ?? 0) >= (b.open ?? 0),
  }))
}

// ── tooltip ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PriceTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d: ChartPoint = payload[0]?.payload
  if (!d) return null
  const up = (d.close ?? 0) >= (d.open ?? 0)

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1f2e]/95 px-3 py-2.5 text-xs shadow-2xl backdrop-blur-sm">
      <p className="mb-2 font-semibold tracking-wide text-gray-300">{d.date}</p>
      <div className="space-y-1">
        <Row label="O" value={d.open?.toFixed(2)} />
        <Row label="H" value={d.high?.toFixed(2)} color="text-emerald-400" />
        <Row label="L" value={d.low?.toFixed(2)} color="text-red-400" />
        <Row
          label="C"
          value={d.close?.toFixed(2)}
          color={up ? "text-emerald-400" : "text-red-400"}
          bold
        />
        {d.volume != null && (
          <>
            <div className="my-1.5 border-t border-white/5" />
            <Row
              label="Vol"
              value={(d.volume / 1e5).toFixed(2) + "L"}
              color="text-gray-400"
            />
          </>
        )}
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
  value?: string
  color?: string
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-5">
      <span className="text-gray-500">{label}</span>
      <span className={cn("tabular-nums", bold && "font-semibold", color)}>
        {value ?? "–"}
      </span>
    </div>
  )
}

// ── volume bar shape ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function VolumeBar(props: any) {
  const { x, y, width, height, payload } = props
  const fill = payload.up
    ? "rgba(34,211,238,0.28)"
    : "rgba(248,113,113,0.28)"
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

export default function PriceChart({
  priceHistory,
  period,
  loading,
  onPeriodChange,
}: Props) {
  const data = buildChartData(priceHistory)
  const prices = data.map((d) => d.close).filter((v): v is number => v !== null)
  const firstClose = prices[0] ?? 0
  const lastClose = prices[prices.length - 1] ?? 0

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111318]">
      {/* ── header ── */}
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3">
        <span className="text-sm font-semibold text-white">Price Chart</span>

        <div className="flex items-center gap-2">
          {loading && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-500" />
          )}
          <div className="flex gap-0.5 rounded-lg border border-white/[0.07] bg-[#0B0F14] p-0.5">
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

      {/* ── charts ── */}
      <div className="px-3 pb-4 pt-3">
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-gray-600">
            No price data
          </div>
        ) : (
          /*
           * Tailwind overrides for Recharts internals:
           * – hide the default axis lines/tick lines (we control stroke via props)
           * – strip any border/outline Recharts adds to its wrapper div
           */
          <div className="[&_.recharts-cartesian-axis-line]:hidden [&_.recharts-cartesian-axis-tick-line]:hidden [&_.recharts-wrapper]:!border-0 [&_.recharts-wrapper]:!outline-none">
            {/* price area chart */}
            <div className="h-[272px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={data}
                  margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id={GRADIENT_ID}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={LINE_COLOR}
                        stopOpacity={0.18}
                      />
                      <stop
                        offset="100%"
                        stopColor={LINE_COLOR}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#4b5563", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={tickInterval(data.length)}
                    tickFormatter={(v) => fmtDate(v as string, period)}
                    dy={6}
                  />

                  <YAxis
                    orientation="right"
                    domain={["auto", "auto"]}
                    tick={{ fill: "#4b5563", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={58}
                    tickFormatter={fmtPrice}
                  />

                  <Tooltip
                    content={<PriceTooltip />}
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
                    activeDot={{
                      r: 3.5,
                      fill: LINE_COLOR,
                      strokeWidth: 0,
                    }}
                    connectNulls
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* volume chart */}
            <div className="mt-1 h-14 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={data}
                  margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
                >
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Bar
                    dataKey="volume"
                    isAnimationActive={false}
                    shape={<VolumeBar />}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-1 pr-[62px] text-right text-[10px] tracking-wide text-gray-700">
              Volume
            </p>

            {/* trend badge */}
            {prices.length >= 2 && (
              <p
                className={cn(
                  "mt-2 text-right text-[10px] font-medium",
                  lastClose >= firstClose ? "text-emerald-500" : "text-red-500",
                )}
              >
                {lastClose >= firstClose ? "▲" : "▼"}{" "}
                {Math.abs(((lastClose - firstClose) / firstClose) * 100).toFixed(2)}
                % this period
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
