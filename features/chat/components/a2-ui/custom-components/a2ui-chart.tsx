import type { CSSProperties } from "react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#ec4899",
  "#6366f1",
]

type ChartType = "pie" | "bar" | "line" | "area" | "histogram"

export function normalizeChartType(value: unknown): ChartType {
  return value === "pie" ||
    value === "bar" ||
    value === "line" ||
    value === "area" ||
    value === "histogram"
    ? value
    : "bar"
}

export interface ChartDataPoint {
  name: string
  [key: string]: string | number | null | undefined
}

export interface ChartSeriesDefinition {
  key: string
  label?: string
}

function coerceChartNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const n = parseFloat(value.replace(/[$₹,\s]/g, ""))
    return Number.isFinite(n) ? n : Number.NaN
  }
  return Number.NaN
}

function isNumericLike(value: unknown): boolean {
  return Number.isFinite(coerceChartNumber(value))
}

/** Compact axis/tooltip amounts: 1.2K / 3.4M / 96.8B / 1.1T */
export function formatCompactNumber(value: number, unit?: string): string {
  if (!Number.isFinite(value)) return "—"
  const sign = value < 0 ? "-" : ""
  const abs = Math.abs(value)
  const prefix = unit ?? ""

  const trim = (n: number) => {
    const fixed = n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)
    return fixed.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1")
  }

  if (abs >= 1e12) return `${sign}${prefix}${trim(abs / 1e12)}T`
  if (abs >= 1e9) return `${sign}${prefix}${trim(abs / 1e9)}B`
  if (abs >= 1e6) return `${sign}${prefix}${trim(abs / 1e6)}M`
  if (abs >= 1e3) return `${sign}${prefix}${trim(abs / 1e3)}K`
  return `${sign}${prefix}${trim(abs)}`
}

function inferNumericValueKeys(row: ChartDataPoint, xKey: string): string[] {
  return Object.keys(row).filter((k) => k !== xKey && k !== "name" && isNumericLike(row[k]))
}

/**
 * Collect series keys across all rows (not just row 0), so sparse multi-series
 * charts still discover every company/metric column.
 */
function collectSeriesKeys(
  data: ChartDataPoint[],
  xKey: string,
  series?: ChartSeriesDefinition[]
): string[] {
  if (series?.length) return series.map((item) => item.key)
  const keys = new Set<string>()
  for (const row of data) {
    for (const key of inferNumericValueKeys(row, xKey)) keys.add(key)
  }
  return Array.from(keys)
}

/**
 * If the agent sent long/sparse rows (one series populated per x), keep nulls
 * for missing series so Recharts can connectNulls across gaps.
 */
function normalizeChartData(
  data: ChartDataPoint[],
  seriesKeys: string[],
  xKey: string,
  primaryValueKey: string
): ChartDataPoint[] {
  return data.map((row) => {
    const next: ChartDataPoint = { ...row, name: String(row.name ?? row[xKey] ?? "") }
    for (const key of seriesKeys.length ? seriesKeys : [primaryValueKey]) {
      if (key === xKey) continue
      if (!(key in next) || next[key] === null || next[key] === undefined || next[key] === "") {
        next[key] = null
        continue
      }
      const n = coerceChartNumber(next[key])
      next[key] = Number.isFinite(n) ? n : null
    }
    return next
  })
}

interface A2UIChartProps {
  chartType: ChartType
  title?: string
  data: ChartDataPoint[]
  series?: ChartSeriesDefinition[]
  xKey?: string
  xAxisLabel?: string
  yAxisLabel?: string
  colors?: string[]
  unit?: string
}

function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const h = hex.replace("#", "")
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ] as const
  }
  const [r1, g1, b1] = parse(a)
  const [r2, g2, b2] = parse(b)
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
  const r = clamp(r1 + (r2 - r1) * t)
  const g = clamp(g1 + (g2 - g1) * t)
  const bl = clamp(b1 + (b2 - b1) * t)
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`
}

function CustomTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
  unit?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2 text-xs shadow-xl">
      {label && <p className="mb-1 font-semibold text-gray-300">{label}</p>}
      {payload.map((p, i) => {
        if (p.value === null || p.value === undefined) return null
        return (
          <p key={i} style={{ color: p.color }} className="tabular-nums">
            {p.name}: {formatCompactNumber(Number(p.value), unit)}
          </p>
        )
      })}
    </div>
  )
}

function PieTooltip({
  active,
  payload,
  unit,
  pieTotal,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; payload?: Record<string, unknown> }[]
  unit?: string
  pieTotal: number
}) {
  if (!active || !payload?.length) return null

  const d = payload[0]
  const label = d.name ?? String(d.payload?.name ?? "")
  const val = coerceChartNumber(d.value)
  const pct = pieTotal > 0 && Number.isFinite(val) ? (val / pieTotal) * 100 : null
  const pctLabel = pct !== null && Number.isFinite(pct) ? `${pct.toFixed(1)}%` : "—"

  return (
    <div className="rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-gray-300">{label}</p>
      <p className="tabular-nums text-white">
        {Number.isFinite(val) ? formatCompactNumber(val, unit) : String(d.value ?? "—")} ({pctLabel})
      </p>
    </div>
  )
}

function axisLabelStyle(extra?: CSSProperties): CSSProperties {
  return {
    fill: "#9ca3af",
    fontSize: 11,
    fontWeight: 500,
    ...extra,
  }
}

export function A2UIChart({
  chartType,
  title,
  data,
  series,
  xKey = "name",
  xAxisLabel,
  yAxisLabel,
  colors,
  unit,
}: A2UIChartProps) {
  if (!data?.length) return null
  const safeChartType = normalizeChartType(chartType)

  const palette = colors?.length ? colors : CHART_COLORS
  const seriesKeys = collectSeriesKeys(data, xKey, series)
  const primaryValueKey = seriesKeys[0] ?? "value"
  const normalizedData = normalizeChartData(data, seriesKeys, xKey, primaryValueKey)
  const multiSeries = seriesKeys.length > 1

  const pieTotal =
    safeChartType === "pie"
      ? normalizedData.reduce((sum, row) => sum + (coerceChartNumber(row[primaryValueKey]) || 0), 0)
      : 0

  const commonGridProps = {
    strokeDasharray: "3 3",
    stroke: "rgba(255,255,255,0.06)",
  }

  const axisProps = {
    tick: { fill: "#9ca3af", fontSize: 11 },
    axisLine: { stroke: "rgba(255,255,255,0.1)" },
    tickLine: false as const,
  }

  const seriesLabels = new Map(
    (series ?? []).map((item) => [item.key, item.label ?? item.key])
  )

  const histMax = normalizedData.reduce(
    (max, row) => Math.max(max, coerceChartNumber(row[primaryValueKey]) || 0),
    0
  )

  const yTick = (v: number) => formatCompactNumber(Number(v), unit)
  const showCartesianLegend = multiSeries && safeChartType !== "pie"
  const chartMargin = {
    top: 8,
    right: 12,
    left: yAxisLabel ? 8 : 4,
    // Keep room for axis label + legend so they do not overlap
    bottom: showCartesianLegend ? (xAxisLabel ? 52 : 36) : xAxisLabel ? 28 : 8,
  }
  const yAxisWidth = 56

  const xAxisLabelProp = xAxisLabel
    ? {
        value: xAxisLabel,
        position: "insideBottom" as const,
        offset: showCartesianLegend ? -2 : -18,
        style: axisLabelStyle(),
      }
    : undefined
  const yAxisLabelProp = yAxisLabel
    ? {
        value: yAxisLabel,
        angle: -90,
        position: "insideLeft" as const,
        offset: 10,
        style: axisLabelStyle({ textAnchor: "middle" }),
      }
    : undefined

  const legend = (multiSeries || safeChartType === "pie") && (
    <Legend
      verticalAlign="bottom"
      height={28}
      wrapperStyle={{ paddingTop: 4 }}
      formatter={(value) => (
        <span style={{ color: "#d1d5db", fontSize: 12 }}>
          {seriesLabels.get(String(value)) ?? value}
        </span>
      )}
    />
  )

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      {title && <p className="mb-4 text-sm font-semibold text-gray-200">{title}</p>}
      <div className="min-h-[300px] w-full min-w-0">
        <ResponsiveContainer width="100%" height={320}>
          {safeChartType === "pie" ? (
            <PieChart margin={chartMargin}>
              <Pie
                data={normalizedData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={2}
                dataKey={primaryValueKey}
                nameKey="name"
              >
                {normalizedData.map((_, i) => (
                  <Cell key={i} fill={palette[i % palette.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip unit={unit} pieTotal={pieTotal} />} />
              {legend}
            </PieChart>
          ) : safeChartType === "histogram" ? (
            <BarChart data={normalizedData} barCategoryGap={0} margin={chartMargin}>
              <defs>
                <linearGradient id="hist-bar-glow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#67e8f9" stopOpacity={0.95} />
                  <stop offset="55%" stopColor="#22d3ee" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid {...commonGridProps} vertical={false} />
              <XAxis
                dataKey={xKey}
                {...axisProps}
                interval="preserveStartEnd"
                minTickGap={12}
                tick={{ fill: "#9ca3af", fontSize: 10 }}
                label={xAxisLabelProp}
              />
              <YAxis
                {...axisProps}
                width={yAxisWidth}
                allowDecimals={false}
                tickFormatter={yTick}
                label={yAxisLabelProp}
              />
              <Tooltip
                cursor={{ fill: "rgba(34, 211, 238, 0.08)" }}
                content={<CustomTooltip unit={unit} />}
              />
              <Bar
                dataKey={primaryValueKey}
                name={seriesLabels.get(primaryValueKey) ?? "Frequency"}
                radius={[2, 2, 0, 0]}
                isAnimationActive
                animationDuration={700}
              >
                {normalizedData.map((row, i) => {
                  const v = coerceChartNumber(row[primaryValueKey])
                  const intensity = histMax > 0 && Number.isFinite(v) ? v / histMax : 0.4
                  const fill =
                    palette.length > 1
                      ? lerpColor("#0e7490", "#67e8f9", Math.max(0.25, intensity))
                      : "url(#hist-bar-glow)"
                  return (
                    <Cell
                      key={i}
                      fill={fill}
                      stroke="rgba(15, 23, 42, 0.55)"
                      strokeWidth={1}
                    />
                  )
                })}
              </Bar>
            </BarChart>
          ) : safeChartType === "bar" ? (
            <BarChart data={normalizedData} barCategoryGap="30%" margin={chartMargin}>
              <CartesianGrid {...commonGridProps} vertical={false} />
              <XAxis dataKey={xKey} {...axisProps} label={xAxisLabelProp} />
              <YAxis
                {...axisProps}
                width={yAxisWidth}
                tickFormatter={yTick}
                label={yAxisLabelProp}
              />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              {legend}
              {seriesKeys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  name={seriesLabels.get(key) ?? key}
                  fill={palette[i % palette.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : safeChartType === "area" ? (
            <AreaChart data={normalizedData} margin={chartMargin}>
              <defs>
                {seriesKeys.map((key, i) => (
                  <linearGradient key={key} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={palette[i % palette.length]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={palette[i % palette.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid {...commonGridProps} />
              <XAxis dataKey={xKey} {...axisProps} label={xAxisLabelProp} />
              <YAxis
                {...axisProps}
                width={yAxisWidth}
                tickFormatter={yTick}
                label={yAxisLabelProp}
              />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              {legend}
              {seriesKeys.map((key, i) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={seriesLabels.get(key) ?? key}
                  stroke={palette[i % palette.length]}
                  fill={`url(#grad-${i})`}
                  strokeWidth={2}
                  connectNulls
                  dot={{ r: 3, fill: palette[i % palette.length] }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={normalizedData} margin={chartMargin}>
              <CartesianGrid {...commonGridProps} />
              <XAxis dataKey={xKey} {...axisProps} label={xAxisLabelProp} />
              <YAxis
                {...axisProps}
                width={yAxisWidth}
                tickFormatter={yTick}
                label={yAxisLabelProp}
              />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              {legend}
              {seriesKeys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={seriesLabels.get(key) ?? key}
                  stroke={palette[i % palette.length]}
                  strokeWidth={2.5}
                  connectNulls
                  dot={{ r: 3.5, fill: palette[i % palette.length], strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
