"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { TickerInfo } from "../types"

interface Props {
  info: TickerInfo
}

// ── Formatting helpers ──────────────────────────────────────────────────────

function inr(n: number | null | undefined): string {
  if (n == null) return "—"
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function cr(n: number | null | undefined): string {
  if (n == null) return "—"
  return "₹" + (n / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 0 }) + " Cr"
}

function pct(n: number | null | undefined): string {
  if (n == null) return "—"
  return (n * 100).toFixed(2) + "%"
}

// dividendYield is stored already as percent (e.g. 0.41 = 0.41%)
function pctRaw(n: number | null | undefined): string {
  if (n == null) return "—"
  return n.toFixed(2) + "%"
}

function num(n: number | null | undefined, d = 2): string {
  if (n == null) return "—"
  return n.toLocaleString("en-IN", { maximumFractionDigits: d })
}

function sharesCr(n: number | null | undefined): string {
  if (n == null) return "—"
  return (n / 1e7).toFixed(2) + " Cr"
}

function volFmt(n: number | null | undefined): string {
  if (n == null) return "—"
  if (n >= 1e7) return (n / 1e7).toFixed(2) + " Cr"
  if (n >= 1e5) return (n / 1e5).toFixed(2) + " L"
  return n.toLocaleString("en-IN")
}

function unixDate(ts: number | null | undefined): string {
  if (ts == null) return "—"
  return new Date(ts * 1000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function growthFmt(n: number | null | undefined): { text: string; dir: "pos" | "neg" | null } {
  if (n == null) return { text: "—", dir: null }
  return {
    text: (n >= 0 ? "+" : "") + (n * 100).toFixed(2) + "%",
    dir: n >= 0 ? "pos" : "neg",
  }
}

function marginDir(n: number | null | undefined): "pos" | "neg" | null {
  if (n == null) return null
  return n >= 0 ? "pos" : "neg"
}

// ── Row component ───────────────────────────────────────────────────────────

function Row({
  label,
  value,
  dir,
}: {
  label: string
  value: string
  dir?: "pos" | "neg" | null
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.04] px-5 py-2.5 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          dir === "pos"
            ? "text-emerald-400"
            : dir === "neg"
            ? "text-red-400"
            : "text-white",
        )}
      >
        {value}
      </span>
    </div>
  )
}

// ── Risk score badge ────────────────────────────────────────────────────────

function RiskBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-sm font-semibold text-gray-600">—</span>
  const color =
    score <= 3 ? "text-emerald-400" : score <= 6 ? "text-amber-400" : "text-red-400"
  return (
    <span className={cn("text-sm font-bold tabular-nums", color)}>
      {score}
      <span className="text-xs font-normal text-gray-600">/10</span>
    </span>
  )
}

// ── Tabs ────────────────────────────────────────────────────────────────────

const TABS = ["Trading", "Valuation", "Margins", "Dividends", "Financials", "Risk"] as const
type Tab = typeof TABS[number]

// ── Main component ──────────────────────────────────────────────────────────

export default function MarketStatsCard({ info }: Props) {
  const [tab, setTab] = useState<Tab>("Trading")

  const renderContent = () => {
    switch (tab) {
      case "Trading":
        return (
          <>
            <Row label="Previous Close" value={inr(info.previousClose)} />
            <Row label="Open" value={inr(info.open)} />
            <Row label="52W High" value={inr(info.fiftyTwoWeekHigh)} />
            <Row label="52W Low" value={inr(info.fiftyTwoWeekLow)} />
            <Row label="50D Moving Avg" value={inr(info.fiftyDayAverage)} />
            <Row label="200D Moving Avg" value={inr(info.twoHundredDayAverage)} />
            <Row label="Volume" value={volFmt(info.volume)} />
            <Row label="Avg Volume" value={volFmt(info.averageVolume)} />
            <Row label="Beta" value={num(info.beta)} />
          </>
        )

      case "Valuation":
        return (
          <>
            <Row label="Market Cap" value={cr(info.marketCap)} />
            <Row label="Enterprise Value" value={cr(info.enterpriseValue)} />
            <Row label="Trailing P/E" value={num(info.trailingPE)} />
            <Row label="Forward P/E" value={num(info.forwardPE)} />
            <Row label="Price / Book" value={num(info.priceToBook)} />
            <Row label="EV / Revenue" value={num(info.enterpriseToRevenue)} />
            <Row label="EV / EBITDA" value={num(info.enterpriseToEbitda)} />
            <Row label="Trailing EPS" value={inr(info.trailingEps)} />
            <Row label="Forward EPS" value={inr(info.forwardEps)} />
            <Row label="Book Value / Share" value={inr(info.bookValue)} />
          </>
        )

      case "Margins": {
        const eg = growthFmt(info.earningsGrowth)
        const rg = growthFmt(info.revenueGrowth)
        const qg = growthFmt(info.earningsQuarterlyGrowth)
        return (
          <>
            <Row
              label="Gross Margin"
              value={pct(info.grossMargins)}
              dir={marginDir(info.grossMargins)}
            />
            <Row
              label="Operating Margin"
              value={pct(info.operatingMargins)}
              dir={marginDir(info.operatingMargins)}
            />
            <Row
              label="Profit Margin"
              value={pct(info.profitMargins)}
              dir={marginDir(info.profitMargins)}
            />
            <Row label="Earnings Growth (YoY)" value={eg.text} dir={eg.dir} />
            <Row label="Revenue Growth (YoY)" value={rg.text} dir={rg.dir} />
            <Row label="Earnings Growth (QoQ)" value={qg.text} dir={qg.dir} />
          </>
        )
      }

      case "Dividends":
        return (
          <>
            <Row label="Dividend Yield" value={pctRaw(info.dividendYield)} />
            <Row label="Dividend Rate" value={inr(info.dividendRate)} />
            <Row label="Payout Ratio" value={pct(info.payoutRatio)} />
            <Row label="Ex-Dividend Date" value={unixDate(info.exDividendDate)} />
            <Row label="Last Dividend Date" value={unixDate(info.lastDividendDate)} />
          </>
        )

      case "Financials":
        return (
          <>
            <Row label="Total Revenue" value={cr(info.totalRevenue)} />
            <Row label="Revenue / Share" value={inr(info.revenuePerShare)} />
            <Row label="Total Cash" value={cr(info.totalCash)} />
            <Row label="Cash / Share" value={inr(info.totalCashPerShare)} />
            <Row label="Total Debt" value={cr(info.totalDebt)} />
            <Row label="Debt / Equity" value={num(info.debtToEquity)} />
            <Row label="Shares Outstanding" value={sharesCr(info.sharesOutstanding)} />
            <Row label="Float Shares" value={sharesCr(info.floatShares)} />
          </>
        )

      case "Risk":
        return (
          <>
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.04] px-5 py-2.5">
              <span className="text-sm text-gray-400">Audit Risk</span>
              <RiskBadge score={info.auditRisk} />
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.04] px-5 py-2.5">
              <span className="text-sm text-gray-400">Board Risk</span>
              <RiskBadge score={info.boardRisk} />
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.04] px-5 py-2.5">
              <span className="text-sm text-gray-400">Compensation Risk</span>
              <RiskBadge score={info.compensationRisk} />
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.04] px-5 py-2.5">
              <span className="text-sm text-gray-400">Overall Risk</span>
              <RiskBadge score={info.overallRisk} />
            </div>
            <p className="border-t border-white/[0.04] px-5 py-3 text-[11px] text-gray-600">
              Scores 1–10 (lower = less risk). Source: Yahoo Finance ESG ratings.
            </p>
          </>
        )
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111318]">
      <div className="border-b border-white/[0.07] px-5 py-3">
        <h2 className="text-sm font-bold text-white">Market Data</h2>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-white/[0.07] scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors",
              tab === t
                ? "border-[#22d3ee] text-[#22d3ee]"
                : "border-transparent text-gray-500 hover:text-gray-300",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>{renderContent()}</div>
    </div>
  )
}
