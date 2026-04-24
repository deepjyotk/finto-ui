"use client"

import { TrendingUp, TrendingDown, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CompanyInfo } from "../types"

interface Props {
  company: CompanyInfo
  priceChange: number | null
  lastUpdated: string | null
}

const SECTION_LINKS = [
  { href: "#top", label: "Summary" },
  { href: "#chart", label: "Chart" },
  { href: "#quarters", label: "Quarterly" },
  { href: "#profit-loss", label: "Profit & Loss" },
  { href: "#balance-sheet", label: "Balance Sheet" },
  { href: "#cash-flow", label: "Cash Flow" },
  { href: "#ratios", label: "Ratios" },
]

function fmtPrice(n: number | null, currency: string) {
  if (n == null) return "—"
  const sym = currency === "INR" ? "₹" : currency + " "
  return sym + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CompanyNav({ company, priceChange, lastUpdated }: Props) {
  const pos = priceChange != null && priceChange >= 0

  return (
    <div className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#0B0F14]/90 backdrop-blur-md">
      {/* Top row */}
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
        {/* Name */}
        <h1 className="min-w-0 flex-1 truncate text-sm font-bold text-white">
          {company.company_name}
          <span className="ml-1.5 text-xs font-normal text-gray-500">({company.symbol})</span>
        </h1>

        {/* Price + change */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-bold tabular-nums text-white">
            {fmtPrice(company.current_price, company.currency)}
          </span>
          {priceChange != null && (
            <span
              className={cn(
                "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                pos ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400",
              )}
            >
              {pos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {pos ? "+" : ""}{priceChange.toFixed(2)}%
            </span>
          )}
        </div>

        {lastUpdated && (
          <span className="hidden text-[10px] text-gray-600 sm:block">
            {new Date(lastUpdated + "T00:00:00").toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </span>
        )}
      </div>

      {/* Anchor links */}
      <div className="mx-auto flex max-w-5xl gap-0 overflow-x-auto px-4 pb-0 scrollbar-none">
        {SECTION_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="shrink-0 border-b-2 border-transparent px-3 pb-2 text-xs font-medium text-gray-500 transition-colors hover:border-[#22d3ee]/60 hover:text-white"
          >
            {l.label}
          </a>
        ))}
      </div>
    </div>
  )
}
