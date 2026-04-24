"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { TrendingUp, TrendingDown, Search, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CompanyInfo } from "../types"
import { apiClient } from "@/lib/api/client"

interface Props {
  company: CompanyInfo
  priceChange: number | null
  lastUpdated: string | null
}

interface StockSearchResult {
  symbol: string
  symbol_ns: string
  company_name: string
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
  const router = useRouter()

  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<StockSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [searched, setSearched] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openSearch = () => {
    setSearchOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setQuery("")
    setResults([])
    setSearched(false)
    setActiveIdx(-1)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSearch()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [closeSearch])

  // Debounced search
  useEffect(() => {
    const q = query.trim()
    if (q.length < 1) {
      setResults([])
      setSearched(false)
      setLoading(false)
      return
    }
    setLoading(true)
    setActiveIdx(-1)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.request<StockSearchResult[]>(
          `/api/v1/ticker/search?${new URLSearchParams({ q, limit: "8" })}`,
          { method: "GET" },
        )
        setResults(res)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
        setSearched(true)
      }
    }, 200)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query])

  const navigate = useCallback((symbol: string) => {
    closeSearch()
    router.push(`/ticker/${symbol}`)
  }, [closeSearch, router])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)) }
    else if (e.key === "Enter") {
      e.preventDefault()
      if (activeIdx >= 0 && results[activeIdx]) navigate(results[activeIdx].symbol)
      else if (query.trim()) navigate(query.trim().toUpperCase())
    }
    else if (e.key === "Escape") closeSearch()
  }

  return (
    <div className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#0B0F14]/90 backdrop-blur-md">
      {/* Top row */}
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">

        {searchOpen ? (
          /* ── Expanded search ── */
          <div ref={containerRef} className="relative flex flex-1 items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#22d3ee]/40 bg-[#111318] px-3 py-1.5">
              {loading
                ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#22d3ee]" />
                : <Search className="h-3.5 w-3.5 shrink-0 text-gray-500" />
              }
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value.trimStart())}
                onKeyDown={handleKeyDown}
                placeholder="Search stocks… e.g. INFY, TCS"
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button onClick={() => setQuery("")} className="shrink-0 text-gray-600 hover:text-gray-400">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={closeSearch}
              className="shrink-0 text-xs text-gray-500 hover:text-gray-300"
            >
              Cancel
            </button>

            {/* Dropdown */}
            {(results.length > 0 || (searched && !loading)) && (
              <div className="absolute left-0 right-12 top-full z-50 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-white/[0.09] bg-[#111318] shadow-2xl">
                {results.length === 0 ? (
                  <p className="px-4 py-4 text-center text-xs text-gray-500">
                    No results for &ldquo;{query}&rdquo;
                  </p>
                ) : (
                  results.map((item, i) => (
                    <button
                      key={item.symbol_ns}
                      type="button"
                      onMouseDown={() => navigate(item.symbol)}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        i === activeIdx ? "bg-[#22d3ee]/10" : "hover:bg-white/[0.05]",
                        i !== results.length - 1 && "border-b border-white/[0.05]",
                      )}
                    >
                      <span className="shrink-0 font-mono text-xs font-bold text-white">{item.symbol}</span>
                      <span className="min-w-0 flex-1 truncate text-xs text-gray-500">{item.company_name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── Normal row ── */
          <>
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

            {/* Search trigger */}
            <button
              onClick={openSearch}
              aria-label="Search another stock"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 text-gray-500 transition-colors hover:border-white/20 hover:text-white"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </>
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

