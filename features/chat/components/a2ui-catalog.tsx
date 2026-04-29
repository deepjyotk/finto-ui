"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  A2uiSurface,
  MarkdownContext,
  basicCatalog,
  createComponentImplementation,
  type ReactComponentImplementation,
} from "@a2ui/react/v0_9"
import { renderMarkdown } from "@a2ui/markdown-it"
import {
  Catalog,
  DynamicStringSchema,
  DynamicValueSchema,
  MessageProcessor,
  type A2uiClientAction,
  type A2uiMessage,
} from "@a2ui/web_core/v0_9"
import { z } from "zod"

import { cn } from "@/lib/utils"
import type { A2UIClientEvent } from "@/features/chat/redux/chat.types"
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

export const FINANCE_CHAT_CATALOG_ID =
  "https://explainly.ai/catalogs/finance-chat-v1.json"
export const A2UI_STORED_DOCUMENT_TYPE = "a2ui_v0_9_document"
export const A2UI_MAIN_SURFACE_ID = "main"
export const A2UI_HITL_SURFACE_ID = "hitl-form"

// ---------------------------------------------------------------------------
// Shared display components
// ---------------------------------------------------------------------------

interface BadgeProps {
  text: string
  variant?: "success" | "warning" | "error" | "info" | "neutral"
}

function normalizeBadgeVariant(value: unknown): NonNullable<BadgeProps["variant"]> {
  return value === "success" ||
    value === "warning" ||
    value === "error" ||
    value === "info" ||
    value === "neutral"
    ? value
    : "neutral"
}

export function A2UIBadge({ text, variant = "neutral" }: BadgeProps) {
  const safeVariant = normalizeBadgeVariant(variant)
  const variantClass = {
    success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    error: "bg-red-500/20 text-red-300 border-red-500/30",
    info: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    neutral: "bg-white/10 text-gray-300 border-white/20",
  }[safeVariant]

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
          safeVariant === "success" && "bg-emerald-400",
          safeVariant === "warning" && "bg-amber-400",
          safeVariant === "error" && "bg-red-400",
          safeVariant === "info" && "bg-cyan-400",
          safeVariant === "neutral" && "bg-gray-400"
        )}
      />
      {text}
    </span>
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
      <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-white">{value}</p>
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

function normalizeInfoBoxVariant(value: unknown): NonNullable<InfoBoxProps["variant"]> {
  return value === "info" || value === "warning" || value === "success" || value === "error"
    ? value
    : "info"
}

export function A2UIInfoBox({ text, variant = "info" }: InfoBoxProps) {
  const safeVariant = normalizeInfoBoxVariant(variant)
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
  }[safeVariant]

  return (
    <div
      className={cn("flex items-start gap-2.5 rounded-lg border px-4 py-3", styles.wrapper)}
      aria-label={`${safeVariant} notice`}
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

interface TableColumn {
  key: string
  label: string
  format?: "text" | "currency_inr" | "number" | "percentage" | "date" | "boolean"
}

interface DataTableProps {
  columns?: TableColumn[]
  rows: unknown[]
}

function formatCellValue(value: unknown, format: string): string {
  const raw = value === null || value === undefined ? "" : String(value)
  if (!raw) return "—"
  if (format === "currency_inr") {
    const num = parseFloat(raw.replace(/[₹,]/g, ""))
    if (Number.isNaN(num)) return raw
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  if (format === "percentage") {
    const num = parseFloat(raw)
    if (Number.isNaN(num)) return raw
    return `${num.toFixed(2)}%`
  }
  if (format === "number") {
    const num = parseFloat(raw)
    if (Number.isNaN(num)) return raw
    return num.toLocaleString("en-IN")
  }
  if (format === "date") {
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return raw
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date)
  }
  if (format === "boolean") {
    if (typeof value === "boolean") return value ? "Yes" : "No"
    return raw
  }
  return raw
}

function toTitleLabel(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function inferColumnFormat(key: string, values: unknown[]): NonNullable<TableColumn["format"]> {
  const normalizedKey = key.toLowerCase()
  if (normalizedKey.includes("pct") || normalizedKey.includes("percent") || normalizedKey.includes("yield") || normalizedKey.includes("weight") || normalizedKey.includes("drawdown")) {
    return "percentage"
  }
  if (normalizedKey.includes("price") || normalizedKey.includes("profit") || normalizedKey.includes("loss") || normalizedKey.includes("value")) {
    return "currency_inr"
  }
  if (normalizedKey.includes("date") || normalizedKey.endsWith("_at")) return "date"
  if (values.some((value) => typeof value === "boolean")) return "boolean"
  if (values.some((value) => typeof value === "number")) return "number"
  return "text"
}

function inferColumns(rows: unknown[]): TableColumn[] {
  const keys: string[] = []
  for (const row of rows) {
    if (!row || Array.isArray(row) || typeof row !== "object") continue
    for (const key of Object.keys(row)) {
      if (!keys.includes(key)) keys.push(key)
    }
  }
  if (!keys.length) return []

  return keys.map((key) => ({
    key,
    label: toTitleLabel(key),
    format: inferColumnFormat(
      key,
      rows.map((row) =>
        row && !Array.isArray(row) && typeof row === "object"
          ? (row as Record<string, unknown>)[key]
          : undefined
      )
    ),
  }))
}

function isLikelyUrl(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value.trim())
}

function getColumnWidth(column: TableColumn, columnIndex: number): number {
  const key = column.key.toLowerCase()
  const labelLength = column.label.length

  if (key === "symbol" || key === "ticker") return 116
  if (key === "recommendation" || key === "reason" || key === "notes") return 300
  if (key === "sector" || key === "industry") return 220
  if (key.includes("name") || key.includes("company")) return 200
  if (key.includes("url") || key.includes("link")) return 260
  if (column.format === "currency_inr") return 150
  if (column.format === "percentage") return 120
  if (column.format === "number") return 110
  if (column.format === "date") return 150
  if (columnIndex === 0) return 140

  return Math.min(Math.max(labelLength * 12, 130), 240)
}

export function A2UIDataTable({ columns, rows }: DataTableProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  })

  const rightAlignFormats = new Set(["currency_inr", "number", "percentage"])
  const rowCount = rows?.length ?? 0
  const resolvedColumns = columns?.length ? columns : inferColumns(rows ?? [])
  const columnWidths = resolvedColumns.map(getColumnWidth)
  const tableMinWidth = Math.max(640, columnWidths.reduce((sum, width) => sum + width, 0))
  const isWide = resolvedColumns.length > 8

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const maxScrollLeft = el.scrollWidth - el.clientWidth
    setScrollState({
      canScrollLeft: el.scrollLeft > 1,
      canScrollRight: el.scrollLeft < maxScrollLeft - 1,
    })
  }, [])

  useEffect(() => {
    updateScrollState()

    const el = scrollRef.current
    if (!el) return

    el.addEventListener("scroll", updateScrollState, { passive: true })
    window.addEventListener("resize", updateScrollState)

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateScrollState) : null
    observer?.observe(el)

    return () => {
      el.removeEventListener("scroll", updateScrollState)
      window.removeEventListener("resize", updateScrollState)
      observer?.disconnect()
    }
  }, [resolvedColumns.length, rowCount, tableMinWidth, updateScrollState])

  if (!rowCount || !resolvedColumns.length) return null

  const getCellValue = (row: unknown, column: TableColumn, columnIndex: number): unknown => {
    if (Array.isArray(row)) return row[columnIndex]
    if (row && typeof row === "object") return (row as Record<string, unknown>)[column.key]
    return undefined
  }

  return (
    <div className="relative max-w-full overflow-hidden rounded-xl border border-white/10 bg-[#0d1217]">
      <div
        ref={scrollRef}
        className="max-w-full overflow-x-auto"
        tabIndex={scrollState.canScrollLeft || scrollState.canScrollRight ? 0 : undefined}
        aria-label={
          scrollState.canScrollLeft || scrollState.canScrollRight
            ? "Scrollable financial data table"
            : "Financial data table"
        }
      >
        <table
          className={cn("w-full table-auto border-collapse", isWide ? "text-xs" : "text-sm")}
          style={{ minWidth: tableMinWidth }}
          aria-label="Financial data table"
        >
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.06]">
            {resolvedColumns.map((col, i) => (
              <th
                key={i}
                scope="col"
                className={cn(
                  "whitespace-nowrap px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400",
                  rightAlignFormats.has(col.format ?? "") && "text-right"
                )}
                style={{ minWidth: columnWidths[i], width: columnWidths[i] }}
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
              {resolvedColumns.map((col, ci) => {
                const raw = getCellValue(row, col, ci)
                const formatted = formatCellValue(raw, col.format ?? "text")
                const isNumeric = rightAlignFormats.has(col.format ?? "")
                const key = col.key.toLowerCase()
                const isIdentifier = ci === 0 || key === "symbol" || key === "ticker"
                const isLongText = key === "recommendation" || key === "reason" || key === "notes"
                const isUrlCell =
                  !isNumeric &&
                  typeof raw === "string" &&
                  (col.key.toLowerCase() === "url" || isLikelyUrl(raw))

                return (
                  <td
                    key={ci}
                    className={cn(
                      "px-3 py-3 align-top text-gray-200",
                      isNumeric && "whitespace-nowrap text-right font-mono tabular-nums",
                      isIdentifier && "whitespace-nowrap font-semibold text-white",
                      !isNumeric && !isIdentifier && "text-left",
                      isLongText ? "whitespace-normal break-words leading-relaxed" : !isNumeric && !isIdentifier && "whitespace-nowrap"
                    )}
                    style={{ minWidth: columnWidths[ci], width: columnWidths[ci] }}
                  >
                    {isUrlCell ? (
                      <a
                        href={raw}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-cyan-300 underline decoration-cyan-500/50 underline-offset-2 hover:text-cyan-200"
                      >
                        {formatted}
                      </a>
                    ) : (
                      formatted
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
        </table>
      </div>
      {scrollState.canScrollLeft && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0d1217] to-transparent"
          aria-hidden="true"
        />
      )}
      {scrollState.canScrollRight && (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-[#0d1217] to-transparent"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-cyan-400/25 bg-cyan-950/80 px-2.5 py-1 text-[11px] font-medium text-cyan-100 shadow-lg shadow-black/20">
            Scroll for more columns →
          </div>
        </>
      )}
    </div>
  )
}

interface NewsSourceItem {
  source?: string
  title?: string
  url?: string
  href?: string
  link?: string
  label?: string
}

interface SourceListProps {
  sources: unknown[]
  title?: string
}

function normalizeSourceItem(item: unknown): NewsSourceItem | null {
  if (typeof item === "string") return { title: item }
  if (!item || typeof item !== "object") return null

  const raw = item as Record<string, unknown>
  const source =
    typeof raw.source === "string"
      ? raw.source
      : typeof raw.publisher === "string"
        ? raw.publisher
        : undefined
  const title =
    typeof raw.title === "string"
      ? raw.title
      : typeof raw.label === "string"
        ? raw.label
        : undefined
  const url =
    typeof raw.url === "string"
      ? raw.url
      : typeof raw.href === "string"
        ? raw.href
        : typeof raw.link === "string"
          ? raw.link
          : undefined

  if (!source && !title && !url) return null
  return { source, title, url }
}

function getSafeHttpUrl(value: string | undefined): string | null {
  if (!value) return null
  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null
  } catch {
    return null
  }
}

export function A2UISourceList({ sources, title = "Sources" }: SourceListProps) {
  const items = sources.map(normalizeSourceItem).filter((item): item is NewsSourceItem => Boolean(item))
  if (!items.length) return null

  return (
    <div className="mt-1 space-y-2 border-t border-white/10 pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{title}</p>
      <div className="flex flex-col gap-2">
        {items.map((item, index) => {
          const url = getSafeHttpUrl(item.url ?? item.href ?? item.link)
          const source = item.source || "Source"
          const text = item.title || item.label || url || source
          const content = (
            <>
              <span className="shrink-0 rounded-md border border-cyan-400/20 bg-cyan-400/10 px-1.5 py-0.5 text-[11px] font-medium text-cyan-200">
                {source}
              </span>
              <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-gray-300">
                {text}
              </span>
            </>
          )

          return url ? (
            <a
              key={`${url}-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center gap-2 rounded-md border border-white/10 bg-white/[0.025] px-2.5 py-2 text-xs transition-colors hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-100"
            >
              {content}
            </a>
          ) : (
            <div
              key={`${source}-${text}-${index}`}
              className="flex min-w-0 items-center gap-2 rounded-md border border-white/10 bg-white/[0.025] px-2.5 py-2 text-xs"
            >
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}

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

function normalizeChartType(value: unknown): ChartType {
  return value === "pie" || value === "bar" || value === "line" || value === "area"
    ? value
    : "bar"
}

interface ChartDataPoint {
  name: string
  [key: string]: string | number
}

interface ChartSeriesDefinition {
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

// ---------------------------------------------------------------------------
// Official A2UI v0.9 catalog
// ---------------------------------------------------------------------------

const BadgeApi = {
  name: "Badge",
  schema: z.object({
    text: DynamicStringSchema,
    variant: z.enum(["success", "warning", "error", "info", "neutral"]).optional(),
  }),
}

const MetricCardApi = {
  name: "MetricCard",
  schema: z.object({
    label: DynamicStringSchema,
    value: DynamicStringSchema,
    change: DynamicStringSchema.optional(),
  }),
}

const InfoBoxApi = {
  name: "InfoBox",
  schema: z.object({
    text: DynamicStringSchema,
    variant: z.enum(["info", "warning", "success", "error"]).optional(),
  }),
}

const DataTableApi = {
  name: "DataTable",
  schema: z.object({
    columns: DynamicValueSchema,
    rows: DynamicValueSchema,
  }),
}

const SourceListApi = {
  name: "SourceList",
  schema: z.object({
    sources: DynamicValueSchema,
    title: DynamicStringSchema.optional(),
  }),
}

const ChartApi = {
  name: "Chart",
  schema: z.object({
    chartType: z.enum(["pie", "bar", "line", "area"]),
    title: DynamicStringSchema.optional(),
    data: DynamicValueSchema,
    series: DynamicValueSchema.optional(),
    xKey: DynamicStringSchema.optional(),
    colors: DynamicValueSchema.optional(),
    unit: DynamicStringSchema.optional(),
  }),
}

const BadgeComponent = createComponentImplementation(BadgeApi, ({ props }) => (
  <A2UIBadge
    text={String(props.text ?? "")}
    variant={normalizeBadgeVariant(props.variant)}
  />
))

const MetricCardComponent = createComponentImplementation(MetricCardApi, ({ props }) => (
  <A2UIMetricCard
    label={String(props.label ?? "")}
    value={String(props.value ?? "")}
    change={props.change !== undefined ? String(props.change) : undefined}
  />
))

const InfoBoxComponent = createComponentImplementation(InfoBoxApi, ({ props }) => (
  <A2UIInfoBox
    text={String(props.text ?? "")}
    variant={normalizeInfoBoxVariant(props.variant)}
  />
))

const DataTableComponent = createComponentImplementation(DataTableApi, ({ props }) => (
  <A2UIDataTable
    columns={Array.isArray(props.columns) ? (props.columns as TableColumn[]) : []}
    rows={Array.isArray(props.rows) ? (props.rows as unknown[]) : []}
  />
))

const SourceListComponent = createComponentImplementation(SourceListApi, ({ props }) => (
  <A2UISourceList
    sources={Array.isArray(props.sources) ? (props.sources as unknown[]) : []}
    title={props.title !== undefined ? String(props.title) : undefined}
  />
))

const ChartComponent = createComponentImplementation(ChartApi, ({ props }) => (
  <A2UIChart
    chartType={normalizeChartType(props.chartType)}
    title={props.title !== undefined ? String(props.title) : undefined}
    data={Array.isArray(props.data) ? (props.data as ChartDataPoint[]) : []}
    series={Array.isArray(props.series) ? (props.series as ChartSeriesDefinition[]) : undefined}
    xKey={props.xKey !== undefined ? String(props.xKey) : "name"}
    colors={Array.isArray(props.colors) ? (props.colors as string[]) : undefined}
    unit={props.unit !== undefined ? String(props.unit) : undefined}
  />
))

const financeChatComponents: ReactComponentImplementation[] = [
  ...Array.from(basicCatalog.components.values()),
  BadgeComponent,
  MetricCardComponent,
  InfoBoxComponent,
  DataTableComponent,
  SourceListComponent,
  ChartComponent,
]

export const financeChatCatalog = new Catalog<ReactComponentImplementation>(
  FINANCE_CHAT_CATALOG_ID,
  financeChatComponents,
  Array.from(basicCatalog.functions.values())
)

export interface A2UIStoredDocument {
  type: typeof A2UI_STORED_DOCUMENT_TYPE
  mainSurfaceId: string
  messages: A2uiMessage[]
}

export function parseStoredA2UIDocument(raw: string | undefined | null): A2UIStoredDocument | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (
      parsed &&
      parsed.type === A2UI_STORED_DOCUMENT_TYPE &&
      typeof parsed.mainSurfaceId === "string" &&
      Array.isArray(parsed.messages)
    ) {
      return parsed as A2UIStoredDocument
    }
  } catch {
    return null
  }

  return null
}

function getA2UIMessageFromEvent(event: A2UIClientEvent): A2uiMessage | null {
  if (event.event !== "a2ui_message") return null
  const payload = event.payload as { message?: A2uiMessage }
  return payload.message ?? null
}

type A2UIActionHandler = (action: A2uiClientAction) => void | Promise<void>

export function useA2UIMessageProcessor({
  messageKey,
  events = [],
  content,
  onAction,
}: {
  messageKey: string
  events?: A2UIClientEvent[]
  content?: string
  onAction?: A2UIActionHandler
}) {
  const actionHandlerRef = useRef<A2UIActionHandler | undefined>(onAction)
  const processorRef = useRef<MessageProcessor<ReactComponentImplementation> | null>(null)
  const processedEventIdsRef = useRef<Set<string>>(new Set())
  const processedStoredContentRef = useRef<string | null>(null)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    actionHandlerRef.current = onAction
  }, [onAction])

  useEffect(() => {
    const processor = new MessageProcessor<ReactComponentImplementation>(
      [financeChatCatalog],
      async (action) => {
        await actionHandlerRef.current?.(action)
      }
    )

    processorRef.current = processor
    processedEventIdsRef.current = new Set()
    processedStoredContentRef.current = null

    const createdSub = processor.onSurfaceCreated(() => {
      setRevision((v) => v + 1)
    })
    const deletedSub = processor.onSurfaceDeleted(() => {
      setRevision((v) => v + 1)
    })

    setRevision((v) => v + 1)

    return () => {
      createdSub.unsubscribe()
      deletedSub.unsubscribe()
      processor.model.dispose()
      processorRef.current = null
    }
  }, [messageKey])

  useEffect(() => {
    const processor = processorRef.current
    if (!processor || !content || processedEventIdsRef.current.size > 0) return
    if (processedStoredContentRef.current === content) return

    const stored = parseStoredA2UIDocument(content)
    if (!stored) return

    try {
      processor.processMessages(stored.messages)
      processedStoredContentRef.current = content
      setRevision((v) => v + 1)
    } catch (error) {
      console.error("Failed to process stored A2UI document", error)
    }
  }, [content])

  useEffect(() => {
    const processor = processorRef.current
    if (!processor || !events.length) return

    let processedAny = false

    for (const event of events) {
      const message = getA2UIMessageFromEvent(event)
      if (!message || processedEventIdsRef.current.has(event.id)) continue

      try {
        processor.processMessages([message])
        processedEventIdsRef.current.add(event.id)
        processedAny = true
      } catch (error) {
        console.error("Failed to process streamed A2UI message", error, message)
      }
    }

    if (processedAny) {
      setRevision((v) => v + 1)
    }
  }, [events])

  const getSurface = useCallback(
    (surfaceId: string) => processorRef.current?.model.getSurface(surfaceId) ?? null,
    [revision]
  )

  return {
    processor: processorRef.current,
    revision,
    getSurface,
  }
}

export function findLatestHitlFormPayload(
  events: A2UIClientEvent[] | undefined
): { threadId: string; surfaceId: string; task?: string } | null {
  if (!events?.length) return null

  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i]
    if (event.event !== "hitl_form") continue

    const payload = event.payload as {
      thread_id?: string
      surface_id?: string
      task?: string
    }

    if (typeof payload.thread_id === "string" && typeof payload.surface_id === "string") {
      return {
        threadId: payload.thread_id,
        surfaceId: payload.surface_id,
        task: typeof payload.task === "string" ? payload.task : undefined,
      }
    }
  }

  return null
}

export function A2UIOfficialSurface({
  messageKey,
  events,
  content,
  surfaceId,
  onAction,
}: {
  messageKey: string
  events?: A2UIClientEvent[]
  content?: string
  surfaceId: string
  onAction?: A2UIActionHandler
}) {
  const { getSurface } = useA2UIMessageProcessor({
    messageKey,
    events,
    content,
    onAction,
  })

  const surface = getSurface(surfaceId)
  if (!surface) return null

  return (
    <div className="a2ui-dark">
      <MarkdownContext.Provider value={renderMarkdown}>
        <A2uiSurface surface={surface} />
      </MarkdownContext.Provider>
    </div>
  )
}

export function renderMarkdownFallback(content: string): ReactNode {
  return (
    <div className="prose prose-invert prose-sm max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-p:text-gray-200 prose-a:text-cyan-400 prose-strong:text-white prose-table:text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
