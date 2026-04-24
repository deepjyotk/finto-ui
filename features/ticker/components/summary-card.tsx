"use client"

import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CompanyInfo, KeyRatio, TickerInfo } from "../types"

interface Props {
  company: CompanyInfo
  keyRatios: KeyRatio[]
  priceChange: number | null
  tickerInfo?: TickerInfo | null
}

function fmtPrice(n: number | null, currency: string) {
  if (n == null) return "—"
  const sym = currency === "INR" ? "₹" : currency + " "
  return sym + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function findRatio(ratios: KeyRatio[], ...labels: string[]): KeyRatio | undefined {
  for (const label of labels) {
    const hit = ratios.find((r) => r.label.toLowerCase().includes(label.toLowerCase()))
    if (hit) return hit
  }
}

function statVal(r: KeyRatio | undefined): string {
  if (!r || r.value == null) return "—"
  return r.value + (r.unit ? " " + r.unit : "")
}

export default function SummaryCard({ company, keyRatios, priceChange, tickerInfo }: Props) {
  const pos = priceChange != null && priceChange >= 0

  // Pick 8 key stats — from key_ratios, fall back to ticker_info where needed
  const mktCap = findRatio(keyRatios, "market cap")
  const pe     = findRatio(keyRatios, "stock p/e", "p/e", "pe ratio")
  const bv     = findRatio(keyRatios, "book value")
  const dYld   = findRatio(keyRatios, "dividend yield", "div yield")
  const roce   = findRatio(keyRatios, "roce")
  const roe    = findRatio(keyRatios, "roe")
  const fv     = findRatio(keyRatios, "face value")
  const hlRaw  = findRatio(keyRatios, "high / low", "52w high", "52 week")

  const highLow =
    hlRaw?.value ??
    (tickerInfo?.fiftyTwoWeekHigh != null && tickerInfo?.fiftyTwoWeekLow != null
      ? `${tickerInfo.fiftyTwoWeekHigh.toLocaleString("en-IN")} / ${tickerInfo.fiftyTwoWeekLow.toLocaleString("en-IN")}`
      : null)

  const STATS = [
    { label: "Market Cap",     val: statVal(mktCap) },
    { label: "52W High / Low", val: highLow ?? "—" },
    { label: "Stock P/E",      val: statVal(pe) },
    { label: "Book Value",     val: statVal(bv) },
    { label: "Div Yield",      val: statVal(dYld) },
    { label: "ROCE",           val: statVal(roce) },
    { label: "ROE",            val: statVal(roe) },
    { label: "Face Value",     val: statVal(fv) },
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111318]">
      {/* Header */}
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: name + price */}
        <div className="flex flex-col gap-2">
          <div>
            <h2 className="text-xl font-extrabold leading-tight text-white">
              {company.company_name}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {company.exchange} · {company.symbol_ns}
              {company.sector ? ` · ${company.sector}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-extrabold tabular-nums text-white">
              {fmtPrice(company.current_price, company.currency)}
            </span>
            {priceChange != null && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums",
                  pos ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400",
                )}
              >
                {pos ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {pos ? "+" : ""}{priceChange.toFixed(2)}%
              </span>
            )}
          </div>
        </div>

        {/* Right: external links */}
        <div className="flex flex-wrap gap-2 self-start text-xs">
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-gray-400 transition-colors hover:text-white"
            >
              Website <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <a
            href={`https://www.nseindia.com/get-quotes/equity?symbol=${company.symbol}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-gray-400 transition-colors hover:text-white"
          >
            NSE <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Key stats grid — 2 rows × 4 cols */}
      <div className="grid grid-cols-2 gap-px border-t border-white/[0.07] bg-white/[0.04] sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5 bg-[#111318] px-4 py-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
              {s.label}
            </span>
            <span className="text-sm font-semibold tabular-nums text-white">{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
