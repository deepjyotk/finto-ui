"use client"

import { cn } from "@/lib/utils"
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

// ---------------------------------------------------------------------------
// A2UI v0.8 Component Catalog
//
// These are the pre-approved native React components that the A2UI renderer
// maps component type strings → concrete UI.  Agents can only request types
// from this catalog — no arbitrary code execution.
// ---------------------------------------------------------------------------

// ─── Type definitions ───────────────────────────────────────────────────────

export type A2UIComponentType =
  | "heading"
  | "badge"
  | "data-table"
  | "metric-card"
  | "info-box"
  | "text"
  | "divider"
  | "chart"

export interface A2UIComponent {
  type: A2UIComponentType
  props: Record<string, unknown>
  children?: string[]
}

export interface A2UIResponse {
  type: "a2ui_response"
  root: string[]
  components: Record<string, A2UIComponent>
}

export function parseA2UIResponse(raw: string): A2UIResponse | null {
  try {
    const trimmed = raw.trim()
    // Strip accidental markdown code fences (```json ... ```)
    const cleaned = trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim()
    const parsed = JSON.parse(cleaned)
    if (
      parsed &&
      parsed.type === "a2ui_response" &&
      Array.isArray(parsed.root) &&
      typeof parsed.components === "object"
    ) {
      return parsed as A2UIResponse
    }
    return null
  } catch {
    return null
  }
}

// ─── Formatting helpers ──────────────────────────────────────────────────────

function formatCellValue(value: unknown, format: string): string {
  const raw = value === null || value === undefined ? "" : String(value)
  if (!raw) return "—"
  if (format === "currency_inr") {
    const num = parseFloat(raw.replace(/[₹,]/g, ""))
    if (isNaN(num)) return raw
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  if (format === "percentage") {
    const num = parseFloat(raw)
    if (isNaN(num)) return raw
    return `${num.toFixed(2)}%`
  }
  if (format === "number") {
    const num = parseFloat(raw)
    if (isNaN(num)) return raw
    return num.toLocaleString("en-IN")
  }
  return raw
}

// ─── Catalog components ──────────────────────────────────────────────────────

interface HeadingProps {
  text: string
  level?: 1 | 2 | 3
}
export function A2UIHeading({ text, level = 1 }: HeadingProps) {
  const sizeClass =
    level === 1
      ? "text-2xl font-bold text-white"
      : level === 2
        ? "text-xl font-semibold text-white"
        : "text-base font-semibold text-gray-200"
  return <p className={cn(sizeClass, "mb-1 leading-tight")}>{text}</p>
}

interface BadgeProps {
  text: string
  variant?: "success" | "warning" | "error" | "info" | "neutral"
}
export function A2UIBadge({ text, variant = "neutral" }: BadgeProps) {
  const variantClass = {
    success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    error: "bg-red-500/20 text-red-300 border-red-500/30",
    info: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    neutral: "bg-white/10 text-gray-300 border-white/20",
  }[variant]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClass
      )}
      aria-label={`Status: ${text}`}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          variant === "success" && "bg-emerald-400",
          variant === "warning" && "bg-amber-400",
          variant === "error" && "bg-red-400",
          variant === "info" && "bg-cyan-400",
          variant === "neutral" && "bg-gray-400"
        )}
      />
      {text}
    </span>
  )
}

interface TableColumn {
  key: string
  label: string
  format?: string
}
interface DataTableProps {
  columns: TableColumn[]
  rows: unknown[][]
}
export function A2UIDataTable({ columns, rows }: DataTableProps) {
  if (!columns?.length || !rows?.length) return null
  const rightAlignFormats = new Set(["currency_inr", "number", "percentage"])
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-max border-collapse text-sm" aria-label="Financial data table">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.06]">
            {columns.map((col, i) => (
              <th
                key={i}
                scope="col"
                className={cn(
                  "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400",
                  rightAlignFormats.has(col.format ?? "") ? "text-right" : "text-left"
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className={cn(
                "border-b border-white/5 transition-colors hover:bg-white/[0.04]",
                ri % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
              )}
            >
              {columns.map((col, ci) => {
                const raw = row[ci]
                const formatted = formatCellValue(raw, col.format ?? "text")
                const isNumeric = rightAlignFormats.has(col.format ?? "")
                return (
                  <td
                    key={ci}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 text-gray-200",
                      isNumeric ? "text-right font-mono tabular-nums" : "text-left",
                      ci === 0 && "font-semibold text-white"
                    )}
                  >
                    {formatted}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
  change?: string
}
export function A2UIMetricCard({ label, value, change }: MetricCardProps) {
  const isPositive = change?.startsWith("+")
  const isNegative = change?.startsWith("-")
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="mb-1 text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-semibold text-white tabular-nums">{value}</p>
      {change && (
        <p
          className={cn(
            "mt-0.5 text-xs font-medium",
            isPositive && "text-emerald-400",
            isNegative && "text-red-400",
            !isPositive && !isNegative && "text-gray-400"
          )}
        >
          {change}
        </p>
      )}
    </div>
  )
}

interface InfoBoxProps {
  text: string
  variant?: "info" | "warning" | "success" | "error"
}
export function A2UIInfoBox({ text, variant = "info" }: InfoBoxProps) {
  const styles = {
    info: {
      wrapper: "border-cyan-500/20 bg-cyan-950/20",
      icon: "text-cyan-400",
      text: "text-cyan-200",
    },
    warning: {
      wrapper: "border-amber-500/20 bg-amber-950/20",
      icon: "text-amber-400",
      text: "text-amber-200",
    },
    success: {
      wrapper: "border-emerald-500/20 bg-emerald-950/20",
      icon: "text-emerald-400",
      text: "text-emerald-200",
    },
    error: {
      wrapper: "border-red-500/20 bg-red-950/20",
      icon: "text-red-400",
      text: "text-red-200",
    },
  }[variant]
  return (
    <div
      className={cn("flex items-start gap-2.5 rounded-lg border px-4 py-3", styles.wrapper)}
      aria-label={`${variant} notice`}
      role="note"
    >
      <svg
        className={cn("mt-0.5 h-4 w-4 flex-shrink-0", styles.icon)}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className={cn("text-sm", styles.text)}>{text}</p>
    </div>
  )
}

export function A2UIText({ content }: { content: string }) {
  return <p className="text-sm leading-relaxed text-gray-300">{content}</p>
}

export function A2UIDivider() {
  return <hr className="border-white/10" />
}

// ─── Chart component ─────────────────────────────────────────────────────────

const CHART_COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ef4444", // red-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#84cc16", // lime-500
  "#ec4899", // pink-500
  "#6366f1", // indigo-500
]

type ChartType = "pie" | "bar" | "line" | "area"

interface ChartDataPoint {
  name: string
  [key: string]: string | number
}

/** Coerce LLM/JSON chart values (often strings) to numbers for Recharts. */
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
  chart_type: ChartType
  title?: string
  /** Array of data objects, each with a "name" key + one or more value keys */
  data: ChartDataPoint[]
  /** Key(s) to plot as value series (default: "value") */
  data_keys?: string[]
  /** Key used for x-axis labels in bar/line/area charts (default: "name") */
  x_key?: string
  /** Optional override colors */
  colors?: string[]
  /** Unit label shown in tooltip (e.g. "₹", "%") */
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
    <div className="rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2 shadow-xl text-xs">
      {label && <p className="mb-1 font-semibold text-gray-300">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="tabular-nums">
          {p.name}: {unit ?? ""}{typeof p.value === "number" ? p.value.toLocaleString("en-IN") : p.value}
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
  /** Sum of pie values (Recharts does not put `percent` on tooltip payload.payload). */
  pieTotal: number
}) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  const label = d.name ?? String(d.payload?.name ?? "")
  const val = coerceChartNumber(d.value)
  const pct =
    pieTotal > 0 && Number.isFinite(val) ? (val / pieTotal) * 100 : null
  const pctLabel = pct !== null && Number.isFinite(pct) ? `${pct.toFixed(1)}%` : "—"
  return (
    <div className="rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-gray-300">{label}</p>
      <p className="text-white tabular-nums">
        {unit ?? ""}
        {Number.isFinite(val) ? val.toLocaleString("en-IN") : String(d.value ?? "—")} ({pctLabel})
      </p>
    </div>
  )
}

export function A2UIChart({
  chart_type,
  title,
  data,
  data_keys,
  x_key = "name",
  colors,
  unit,
}: A2UIChartProps) {
  if (!data?.length) return null
  const palette = colors?.length ? colors : CHART_COLORS
  // Determine which keys to plot (include string numbers — raw `typeof === "number"` misses JSON strings)
  const valueKeys =
    data_keys?.length
      ? data_keys
      : inferNumericValueKeys(data[0], x_key)
  const primaryValueKey = valueKeys[0] ?? "value"
  const normalizedData: ChartDataPoint[] = data.map((row) => {
    const next = { ...row }
    const keysToCoerce = valueKeys.length ? valueKeys : [primaryValueKey]
    for (const key of keysToCoerce) {
      if (key in next && key !== x_key) {
        const n = coerceChartNumber(next[key])
        if (Number.isFinite(n)) next[key] = n
      }
    }
    return next
  })
  const pieTotal =
    chart_type === "pie"
      ? normalizedData.reduce((s, row) => s + coerceChartNumber(row[primaryValueKey]), 0)
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

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      {title && (
        <p className="mb-4 text-sm font-semibold text-gray-200">{title}</p>
      )}
      {/* min-h + min-w-0: ResponsiveContainer often collapses in flex layouts without explicit bounds */}
      <div className="min-h-[300px] w-full min-w-0">
        <ResponsiveContainer width="100%" height={300}>
        {chart_type === "pie" ? (
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
            <Legend
              formatter={(value) => (
                <span style={{ color: "#d1d5db", fontSize: 12 }}>{value}</span>
              )}
            />
          </PieChart>
        ) : chart_type === "bar" ? (
          <BarChart data={normalizedData} barCategoryGap="30%">
            <CartesianGrid {...commonGridProps} vertical={false} />
            <XAxis dataKey={x_key} {...axisProps} />
            <YAxis {...axisProps} tickFormatter={(v) => `${unit ?? ""}${v.toLocaleString("en-IN")}`} />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            {valueKeys.length > 1 && <Legend formatter={(v) => <span style={{ color: "#d1d5db", fontSize: 12 }}>{v}</span>} />}
            {valueKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={palette[i % palette.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        ) : chart_type === "area" ? (
          <AreaChart data={normalizedData}>
            <defs>
              {valueKeys.map((key, i) => (
                <linearGradient key={key} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={palette[i % palette.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={palette[i % palette.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid {...commonGridProps} />
            <XAxis dataKey={x_key} {...axisProps} />
            <YAxis {...axisProps} tickFormatter={(v) => `${unit ?? ""}${v.toLocaleString("en-IN")}`} />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            {valueKeys.length > 1 && <Legend formatter={(v) => <span style={{ color: "#d1d5db", fontSize: 12 }}>{v}</span>} />}
            {valueKeys.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={palette[i % palette.length]}
                fill={`url(#grad-${i})`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        ) : (
          /* default: line */
          <LineChart data={normalizedData}>
            <CartesianGrid {...commonGridProps} />
            <XAxis dataKey={x_key} {...axisProps} />
            <YAxis {...axisProps} tickFormatter={(v) => `${unit ?? ""}${v.toLocaleString("en-IN")}`} />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            {valueKeys.length > 1 && <Legend formatter={(v) => <span style={{ color: "#d1d5db", fontSize: 12 }}>{v}</span>} />}
            {valueKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
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

// ─── Render a single component from the catalog ──────────────────────────────

export function renderA2UIComponent(
  id: string,
  component: A2UIComponent,
  allComponents: Record<string, A2UIComponent>
): React.ReactNode {
  const { type, props } = component

  switch (type) {
    case "heading":
      return (
        <A2UIHeading
          key={id}
          text={String(props.text ?? "")}
          level={(props.level as 1 | 2 | 3) ?? 1}
        />
      )
    case "badge":
      return (
        <A2UIBadge
          key={id}
          text={String(props.text ?? "")}
          variant={(props.variant as BadgeProps["variant"]) ?? "neutral"}
        />
      )
    case "data-table":
      return (
        <A2UIDataTable
          key={id}
          columns={(props.columns as TableColumn[]) ?? []}
          rows={(props.rows as unknown[][]) ?? []}
        />
      )
    case "metric-card":
      return (
        <A2UIMetricCard
          key={id}
          label={String(props.label ?? "")}
          value={String(props.value ?? "")}
          change={props.change !== undefined ? String(props.change) : undefined}
        />
      )
    case "info-box":
      return (
        <A2UIInfoBox
          key={id}
          text={String(props.text ?? "")}
          variant={(props.variant as InfoBoxProps["variant"]) ?? "info"}
        />
      )
    case "text":
      return <A2UIText key={id} content={String(props.content ?? "")} />
    case "divider":
      return <A2UIDivider key={id} />
    case "chart":
      return (
        <A2UIChart
          key={id}
          chart_type={(props.chart_type as ChartType) ?? "bar"}
          title={props.title !== undefined ? String(props.title) : undefined}
          data={(props.data as ChartDataPoint[]) ?? []}
          data_keys={props.data_keys !== undefined ? (props.data_keys as string[]) : undefined}
          x_key={props.x_key !== undefined ? String(props.x_key) : "name"}
          colors={props.colors !== undefined ? (props.colors as string[]) : undefined}
          unit={props.unit !== undefined ? String(props.unit) : undefined}
        />
      )
    default:
      return null
  }
}
