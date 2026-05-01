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

type ChartType = "pie" | "bar" | "line" | "area"

export function normalizeChartType(value: unknown): ChartType {
  return value === "pie" || value === "bar" || value === "line" || value === "area"
    ? value
    : "bar"
}

export interface ChartDataPoint {
  name: string
  [key: string]: string | number
}

export interface ChartSeriesDefinition {
  key: string
  label?: string
}

function coerceChartNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const n = parseFloat(value.replace(/[₹,\s]/g, ""))
    return Number.isFinite(n) ? n : Number.NaN
  }
  return Number.NaN
}

function isNumericLike(value: unknown): boolean {
  return Number.isFinite(coerceChartNumber(value))
}

function inferNumericValueKeys(row: ChartDataPoint, xKey: string): string[] {
  return Object.keys(row).filter((k) => k !== xKey && k !== "name" && isNumericLike(row[k]))
}

interface A2UIChartProps {
  chartType: ChartType
  title?: string
  data: ChartDataPoint[]
  series?: ChartSeriesDefinition[]
  xKey?: string
  colors?: string[]
  unit?: string
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
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="tabular-nums">
          {p.name}: {unit ?? ""}
          {typeof p.value === "number" ? p.value.toLocaleString("en-IN") : p.value}
        </p>
      ))}
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
        {unit ?? ""}
        {Number.isFinite(val) ? val.toLocaleString("en-IN") : String(d.value ?? "—")} ({pctLabel})
      </p>
    </div>
  )
}

export function A2UIChart({
  chartType,
  title,
  data,
  series,
  xKey = "name",
  colors,
  unit,
}: A2UIChartProps) {
  if (!data?.length) return null
  const safeChartType = normalizeChartType(chartType)

  const palette = colors?.length ? colors : CHART_COLORS
  const seriesKeys =
    series?.length
      ? series.map((item) => item.key)
      : inferNumericValueKeys(data[0], xKey)
  const primaryValueKey = seriesKeys[0] ?? "value"

  const normalizedData: ChartDataPoint[] = data.map((row) => {
    const next = { ...row }
    for (const key of seriesKeys.length ? seriesKeys : [primaryValueKey]) {
      if (key in next && key !== xKey) {
        const n = coerceChartNumber(next[key])
        if (Number.isFinite(n)) next[key] = n
      }
    }
    return next
  })

  const pieTotal =
    safeChartType === "pie"
      ? normalizedData.reduce((sum, row) => sum + coerceChartNumber(row[primaryValueKey]), 0)
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

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      {title && <p className="mb-4 text-sm font-semibold text-gray-200">{title}</p>}
      <div className="min-h-[300px] w-full min-w-0">
        <ResponsiveContainer width="100%" height={300}>
          {safeChartType === "pie" ? (
            <PieChart>
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
              <Legend formatter={(value) => <span style={{ color: "#d1d5db", fontSize: 12 }}>{value}</span>} />
            </PieChart>
          ) : safeChartType === "bar" ? (
            <BarChart data={normalizedData} barCategoryGap="30%">
              <CartesianGrid {...commonGridProps} vertical={false} />
              <XAxis dataKey={xKey} {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `${unit ?? ""}${v.toLocaleString("en-IN")}`} />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              {seriesKeys.length > 1 && (
                <Legend formatter={(value) => <span style={{ color: "#d1d5db", fontSize: 12 }}>{seriesLabels.get(String(value)) ?? value}</span>} />
              )}
              {seriesKeys.map((key, i) => (
                <Bar key={key} dataKey={key} name={seriesLabels.get(key) ?? key} fill={palette[i % palette.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : safeChartType === "area" ? (
            <AreaChart data={normalizedData}>
              <defs>
                {seriesKeys.map((key, i) => (
                  <linearGradient key={key} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={palette[i % palette.length]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={palette[i % palette.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid {...commonGridProps} />
              <XAxis dataKey={xKey} {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `${unit ?? ""}${v.toLocaleString("en-IN")}`} />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              {seriesKeys.length > 1 && (
                <Legend formatter={(value) => <span style={{ color: "#d1d5db", fontSize: 12 }}>{seriesLabels.get(String(value)) ?? value}</span>} />
              )}
              {seriesKeys.map((key, i) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={seriesLabels.get(key) ?? key}
                  stroke={palette[i % palette.length]}
                  fill={`url(#grad-${i})`}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={normalizedData}>
              <CartesianGrid {...commonGridProps} />
              <XAxis dataKey={xKey} {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `${unit ?? ""}${v.toLocaleString("en-IN")}`} />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              {seriesKeys.length > 1 && (
                <Legend formatter={(value) => <span style={{ color: "#d1d5db", fontSize: 12 }}>{seriesLabels.get(String(value)) ?? value}</span>} />
              )}
              {seriesKeys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={seriesLabels.get(key) ?? key}
                  stroke={palette[i % palette.length]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: palette[i % palette.length] }}
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
