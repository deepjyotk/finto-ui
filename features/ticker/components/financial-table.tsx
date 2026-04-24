"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import type { FinancialStatement } from "../types"

interface Props {
  statement: FinancialStatement
  title: string
}

const BOLD_METRICS = new Set([
  // P&L
  "Total Revenue",
  "Net Income",
  "Operating Income",
  "Gross Profit",
  "EBITDA",
  "Net Profit",
  "Revenue",
  "Profit After Tax",
  "Profit Before Tax",
  // Balance Sheet
  "Total Assets",
  "Total Liabilities",
  "Total Equity",
  "Shareholders Equity",
  "Net Worth",
  "Total Current Assets",
  "Total Current Liabilities",
  "Total Non Current Assets",
  "Total Non Current Liabilities",
  // Cash Flow
  "Free Cash Flow",
  "Operating Cash Flow",
  "Cash From Operations",
  "Cash From Investing",
  "Cash From Financing",
  "Net Cash Flow",
  "Cash And Cash Equivalents",
  "Net Change In Cash",
])

function fmtPeriod(iso: string): string {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" })
}

function toCr(raw: number | null): string {
  if (raw == null) return "—"
  const cr = raw / 1e7
  return cr.toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

function computeCAGR(values: (number | null)[], years: number): string {
  const defined = values.filter((v): v is number => v != null)
  if (defined.length < 2) return "—"
  const first = defined[0]
  const last = defined[defined.length - 1]
  if (first <= 0 || last <= 0) return "—"
  const cagr = (Math.pow(last / first, 1 / years) - 1) * 100
  return `${cagr >= 0 ? "+" : ""}${cagr.toFixed(1)}%`
}

function CAGRBox({ label, value }: { label: string; value: string }) {
  const pos = value.startsWith("+")
  const neg = value.startsWith("-")
  return (
    <div className="flex flex-col items-center rounded-xl border border-white/[0.07] bg-[#111318] px-3 py-2.5 text-center">
      <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">{label}</span>
      <span
        className={cn(
          "mt-0.5 text-sm font-bold tabular-nums",
          pos ? "text-emerald-400" : neg ? "text-red-400" : "text-gray-400",
        )}
      >
        {value}
      </span>
    </div>
  )
}

export default function FinancialTable({ statement, title }: Props) {
  const { periods, rows } = statement
  const isAnnual = statement.statement_type === "annual"

  // Find Revenue and Net Income rows for CAGR
  const revenueRow = rows.find((r) =>
    ["Total Revenue", "Revenue", "Net Sales"].some((k) => r.metric.toLowerCase().includes(k.toLowerCase())),
  )
  const profitRow = rows.find((r) =>
    ["Net Income", "Net Profit", "Profit After Tax"].some((k) =>
      r.metric.toLowerCase().includes(k.toLowerCase()),
    ),
  )

  const cagrs = useMemo(() => {
    if (!isAnnual || !revenueRow || !profitRow) return null
    const revVals = periods.map((p) => revenueRow.values[p] ?? null)
    const profVals = periods.map((p) => profitRow.values[p] ?? null)
    const n = periods.length
    return {
      sales10: computeCAGR(revVals, Math.min(10, n - 1)),
      sales5: computeCAGR(revVals.slice(Math.max(0, n - 6)), 5),
      sales3: computeCAGR(revVals.slice(Math.max(0, n - 4)), 3),
      profit10: computeCAGR(profVals, Math.min(10, n - 1)),
      profit5: computeCAGR(profVals.slice(Math.max(0, n - 6)), 5),
      profit3: computeCAGR(profVals.slice(Math.max(0, n - 4)), 3),
    }
  }, [isAnnual, periods, revenueRow, profitRow])

  // For quarterly: compute OPM% and Tax% inline
  const opIncomeRow = rows.find((r) => r.metric.toLowerCase().includes("operating income"))
  const revenueRowQ = rows.find((r) => ["total revenue", "revenue", "net sales"].some((k) => r.metric.toLowerCase().includes(k)))
  const taxRow = rows.find((r) => r.metric.toLowerCase().includes("tax provision") || r.metric.toLowerCase().includes("income tax"))
  const pretaxRow = rows.find((r) => r.metric.toLowerCase().includes("pretax") || r.metric.toLowerCase().includes("profit before tax"))

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111318]">
      {/* Header */}
      <div className="flex items-baseline justify-between border-b border-white/[0.07] px-5 py-3">
        <h2 className="text-sm font-bold text-white">{title}</h2>
        <span className="text-[11px] text-gray-500">Figures in ₹ Crores</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] bg-[#1a1f2e]">
              <th className="sticky left-0 z-10 bg-[#1a1f2e] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Metric
              </th>
              {periods.map((p, i) => (
                <th
                  key={p}
                  className={cn(
                    "px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap",
                    i === periods.length - 1 && "bg-[#22d3ee]/[0.04]",
                  )}
                >
                  {fmtPeriod(p)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const isBold = BOLD_METRICS.has(row.metric)
              return (
                <tr
                  key={row.metric + ri}
                  className={cn(
                    "border-b border-white/[0.04] last:border-0",
                    ri % 2 === 0 ? "bg-[#111318]" : "bg-[#0f1318]",
                  )}
                >
                  <td
                    className={cn(
                      "sticky left-0 z-10 min-w-[160px] max-w-[220px] truncate px-4 py-2.5",
                      ri % 2 === 0 ? "bg-[#111318]" : "bg-[#0f1318]",
                      isBold ? "font-bold text-white" : "text-gray-400",
                    )}
                  >
                    {row.metric}
                  </td>
                  {periods.map((p, i) => {
                    const val = row.values[p]
                    const numeric = val != null ? val / 1e7 : null
                    const isLastCol = i === periods.length - 1
                    return (
                      <td
                        key={p}
                        className={cn(
                          "px-4 py-2.5 text-right tabular-nums",
                          isLastCol && "bg-[#22d3ee]/[0.04]",
                          isBold ? "font-bold" : "font-normal",
                          val == null
                            ? "text-gray-600"
                            : numeric! >= 0
                            ? "text-white"
                            : "text-red-400",
                        )}
                      >
                        {toCr(val)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}

            {/* OPM% row — quarterly only */}
            {!isAnnual && opIncomeRow && revenueRowQ && (
              <tr className="border-b border-white/[0.04] bg-[#1a1f2e]">
                <td className="sticky left-0 z-10 min-w-[160px] bg-[#1a1f2e] px-4 py-2.5 font-semibold text-[#22d3ee]">
                  OPM %
                </td>
                {periods.map((p, i) => {
                  const op = opIncomeRow.values[p]
                  const rev = revenueRowQ.values[p]
                  const opm = op != null && rev != null && rev !== 0 ? ((op / rev) * 100).toFixed(0) + "%" : "—"
                  return (
                    <td key={p} className={cn("px-4 py-2.5 text-right tabular-nums text-[#22d3ee] font-semibold", i === periods.length - 1 && "bg-[#22d3ee]/[0.06]")}>
                      {opm}
                    </td>
                  )
                })}
              </tr>
            )}

            {/* Tax% row — quarterly only */}
            {!isAnnual && taxRow && pretaxRow && (
              <tr className="border-b border-white/[0.04] bg-[#111318]">
                <td className="sticky left-0 z-10 min-w-[160px] bg-[#111318] px-4 py-2.5 font-semibold text-amber-400">
                  Tax %
                </td>
                {periods.map((p, i) => {
                  const tax = taxRow.values[p]
                  const pre = pretaxRow.values[p]
                  const pct = tax != null && pre != null && pre !== 0 ? ((tax / pre) * 100).toFixed(0) + "%" : "—"
                  return (
                    <td key={p} className={cn("px-4 py-2.5 text-right tabular-nums text-amber-400 font-semibold", i === periods.length - 1 && "bg-[#22d3ee]/[0.04]")}>
                      {pct}
                    </td>
                  )
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CAGR boxes — annual only */}
      {isAnnual && cagrs && (
        <div className="border-t border-white/[0.07] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">CAGR Summary</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <CAGRBox label="Sales 10Y" value={cagrs.sales10} />
            <CAGRBox label="Sales 5Y" value={cagrs.sales5} />
            <CAGRBox label="Sales 3Y" value={cagrs.sales3} />
            <CAGRBox label="Profit 10Y" value={cagrs.profit10} />
            <CAGRBox label="Profit 5Y" value={cagrs.profit5} />
            <CAGRBox label="Profit 3Y" value={cagrs.profit3} />
          </div>
        </div>
      )}
    </div>
  )
}
