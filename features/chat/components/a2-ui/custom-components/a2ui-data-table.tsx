"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

export interface TableColumn {
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
