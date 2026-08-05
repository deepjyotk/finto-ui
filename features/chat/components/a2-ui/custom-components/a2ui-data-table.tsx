"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

// Same base URL resolution as company-logo.tsx
const CDN_BASE =
  process.env.NEXT_PUBLIC_CDN_BASE_URL?.replace(/\/$/, "") ??
  "https://pub-02ae21b71a13498f94e99ef653d36c8a.r2.dev"

const GCS_BASE =
  process.env.NEXT_PUBLIC_GCS_LOGOS_BASE_URL?.replace(/\/$/, "") ??
  "https://storage.googleapis.com/finto-logos"

export interface TableColumn {
  key: string
  label: string
  format?: "text" | "currency_inr" | "currency_usd" | "number" | "percentage" | "date" | "boolean" | "company_identity"
}

interface DataTableProps {
  columns?: TableColumn[]
  rows: unknown[]
}

// ── Company identity cell ────────────────────────────────────────────────────
// Expects value shaped as "Company Name - SYMBOL" or "Company Name - SYMBOL.NS".
// Strips the exchange suffix (.NS / .BO) before building logo URLs so they
// match CDN/GCS file names (e.g. RELIANCE.svg, not RELIANCE.NS.svg).
//
// Probe order mirrors company-logo.tsx:
//   CDN .svg → CDN .png → GCS .svg → GCS .png → initials fallback

function extractSymbolForLogo(rawSymbol: string): string {
  return rawSymbol.replace(/\.(NS|BO|BSE)$/i, "").toUpperCase()
}

function buildLogoCandidates(symbol: string): string[] {
  const s = symbol.toUpperCase()
  return [
    `${CDN_BASE}/${s}.svg`,
    `${CDN_BASE}/${s}.png`,
    `${GCS_BASE}/${s}.svg`,
    `${GCS_BASE}/${s}.png`,
  ]
}

// Mirrors the PALETTE + pickColor from company-logo.tsx for consistent colours.
const LOGO_PALETTE = [
  "bg-violet-600",
  "bg-cyan-600",
  "bg-emerald-600",
  "bg-orange-600",
  "bg-rose-600",
  "bg-blue-600",
]

function pickLogoColor(symbol: string): string {
  let hash = 0
  for (const ch of symbol) hash = ((hash * 31) + ch.charCodeAt(0)) >>> 0
  return LOGO_PALETTE[hash % LOGO_PALETTE.length]
}

function CompanyIdentityCell({ value }: { value: string }) {
  const lastDash = value.lastIndexOf(" - ")
  const rawSymbol = lastDash >= 0 ? value.slice(lastDash + 3).trim() : value.trim()
  const logoSymbol = extractSymbolForLogo(rawSymbol)
  const candidates = buildLogoCandidates(logoSymbol)
  const [candidateIdx, setCandidateIdx] = useState(0)

  const allFailed = candidateIdx >= candidates.length

  return (
    <span className="flex items-center gap-2">
      {allFailed ? (
        <span
          className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${pickLogoColor(logoSymbol)}`}
          style={{ width: 20, height: 20, fontSize: 8 }}
        >
          {logoSymbol.slice(0, 2)}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={candidates[candidateIdx]}
          src={candidates[candidateIdx]}
          alt={rawSymbol}
          width={20}
          height={20}
          className="shrink-0 rounded-full object-contain"
          onError={() => setCandidateIdx((i) => i + 1)}
        />
      )}
      <span>{value}</span>
    </span>
  )
}

/** Format money while preserving K/M/B/T (e.g. "$96.77B" must not become "$96.77"). */
function formatMoneyCell(value: unknown, currency: "INR" | "USD"): string {
  const symbol = currency === "INR" ? "₹" : "$"
  if (typeof value === "number" && Number.isFinite(value)) {
    return formatCompactMoney(value, symbol)
  }

  const raw = value === null || value === undefined ? "" : String(value).trim()
  if (!raw) return "—"

  // Already compact: "$96.77B", "₹1.2L", "409M", "-$1.44B"
  const compact = raw.match(
    /^([+-]?)\s*[₹$]?\s*([0-9]+(?:\.[0-9]+)?)\s*([KMBTkmbt])\b/
  )
  if (compact) {
    const [, sign, amount, suffix] = compact
    return `${sign}${symbol}${amount}${suffix.toUpperCase()}`
  }

  const cleaned = raw.replace(/[₹$,\s]/g, "")
  const num = parseFloat(cleaned)
  if (Number.isNaN(num)) return raw
  return formatCompactMoney(num, symbol)
}

function formatCompactMoney(value: number, symbol: string): string {
  const sign = value < 0 ? "-" : ""
  const abs = Math.abs(value)
  const trim = (n: number) => {
    const fixed = n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)
    return fixed.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1")
  }

  if (abs >= 1e12) return `${sign}${symbol}${trim(abs / 1e12)}T`
  if (abs >= 1e9) return `${sign}${symbol}${trim(abs / 1e9)}B`
  if (abs >= 1e6) return `${sign}${symbol}${trim(abs / 1e6)}M`
  if (abs >= 1e3) return `${sign}${symbol}${trim(abs / 1e3)}K`
  return `${sign}${symbol}${abs.toLocaleString(symbol === "₹" ? "en-IN" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatCellValue(value: unknown, format: string): string {
  const raw = value === null || value === undefined ? "" : String(value)
  if (!raw && typeof value !== "number") return "—"
  if (format === "currency_inr") return formatMoneyCell(value, "INR")
  if (format === "currency_usd") return formatMoneyCell(value, "USD")
  if (format === "percentage") {
    const num = parseFloat(raw)
    if (Number.isNaN(num)) return raw
    return `${num.toFixed(2)}%`
  }
  if (format === "number") {
    // Preserve compact suffixes on numeric text cells too ("1.44B")
    const compact = raw.match(/^([+-]?)\s*([0-9]+(?:\.[0-9]+)?)\s*([KMBTkmbt])\b/)
    if (compact) {
      const [, sign, amount, suffix] = compact
      return `${sign}${amount}${suffix.toUpperCase()}`
    }
    const num = typeof value === "number" ? value : parseFloat(raw)
    if (Number.isNaN(num)) return raw
    if (Math.abs(num) >= 1e3) return formatCompactMoney(num, "")
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

  if (column.format === "company_identity") return 280
  if (key === "symbol" || key === "ticker") return 116
  if (key === "recommendation" || key === "reason" || key === "notes") return 300
  if (key === "sector" || key === "industry") return 220
  if (key.includes("name") || key.includes("company")) return 200
  if (key.includes("url") || key.includes("link")) return 260
  if (column.format === "currency_inr" || column.format === "currency_usd") return 150
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

  const rightAlignFormats = new Set(["currency_inr", "currency_usd", "number", "percentage"])
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
                const isCompanyIdentity = col.format === "company_identity"
                const formatted = isCompanyIdentity ? String(raw ?? "") : formatCellValue(raw, col.format ?? "text")
                const isNumeric = rightAlignFormats.has(col.format ?? "")
                const key = col.key.toLowerCase()
                const isIdentifier = ci === 0 || key === "symbol" || key === "ticker"
                const isLongText = key === "recommendation" || key === "reason" || key === "notes"
                const isUrlCell =
                  !isNumeric &&
                  !isCompanyIdentity &&
                  typeof raw === "string" &&
                  (col.key.toLowerCase() === "url" || isLikelyUrl(raw))

                return (
                  <td
                    key={ci}
                    className={cn(
                      "px-3 py-3 align-top text-gray-200",
                      isNumeric && "whitespace-nowrap text-right font-mono tabular-nums",
                      (isIdentifier || isCompanyIdentity) && "font-semibold text-white",
                      !isNumeric && !isIdentifier && "text-left",
                      isCompanyIdentity && "whitespace-nowrap",
                      isLongText ? "whitespace-normal break-words leading-relaxed" : !isNumeric && !isIdentifier && !isCompanyIdentity && "whitespace-nowrap"
                    )}
                    style={{ minWidth: columnWidths[ci], width: columnWidths[ci] }}
                  >
                    {isCompanyIdentity ? (
                      <CompanyIdentityCell value={formatted} />
                    ) : isUrlCell ? (
                      <a
                        href={raw as string}
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
