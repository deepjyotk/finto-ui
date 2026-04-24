"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/api/client"

interface StockSearchResult {
  symbol: string
  symbol_ns: string
  company_name: string
}

const POPULAR = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ITC"]

async function searchStocks(q: string): Promise<StockSearchResult[]> {
  const params = new URLSearchParams({ q, limit: "10" })
  return apiClient.request<StockSearchResult[]>(
    `/api/v1/ticker/search?${params}`,
    { method: "GET" },
  )
}

export default function TickerSearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<StockSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [searched, setSearched] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced search
  useEffect(() => {
    const q = query.trim()
    if (q.length < 1) {
      setResults([])
      setOpen(false)
      setSearched(false)
      setLoading(false)
      return
    }

    setLoading(true)
    setActiveIndex(-1)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await searchStocks(q)
        setResults(res)
        setSearched(true)
        setOpen(true)
      } catch {
        setResults([])
        setSearched(true)
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const navigate = useCallback(
    (symbol: string) => {
      setOpen(false)
      setQuery("")
      router.push(`/ticker/${symbol}`)
    },
    [router],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    const len = results.length

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, len - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (activeIndex >= 0 && results[activeIndex]) {
        navigate(results[activeIndex].symbol)
      } else if (query.trim()) {
        navigate(query.trim().toUpperCase())
      }
    } else if (e.key === "Escape") {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      {/* Input */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border bg-[#111318] px-4 py-3.5 shadow-[0_0_40px_rgba(34,211,238,0.08)] transition-all",
          open || query
            ? "border-[#22d3ee]/50 shadow-[0_0_40px_rgba(34,211,238,0.15)]"
            : "border-white/10 hover:border-white/20",
        )}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#22d3ee]" />
        ) : (
          <Search className="h-5 w-5 shrink-0 text-gray-500" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.trimStart())}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          onKeyDown={handleKeyDown}
          placeholder="Search stocks… e.g. Reliance, INFY, TCS"
          className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-gray-600"
          autoComplete="off"
          spellCheck={false}
          aria-label="Search stocks"
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setOpen(false); inputRef.current?.focus() }}
            className="shrink-0 text-gray-600 hover:text-gray-400 transition-colors"
            aria-label="Clear"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto overscroll-contain rounded-2xl border border-white/[0.09] bg-[#111318] shadow-2xl">
          {results.length === 0 && searched && !loading ? (
            <div className="px-4 py-5 text-center text-sm text-gray-500">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((item, i) => (
              <button
                key={item.symbol_ns}
                type="button"
                onMouseDown={() => navigate(item.symbol)}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                  i === activeIndex
                    ? "bg-[#22d3ee]/10"
                    : "hover:bg-white/[0.05]",
                  i !== results.length - 1 && "border-b border-white/[0.05]",
                )}
                aria-selected={i === activeIndex}
              >
                <span className="shrink-0 font-mono text-sm font-bold text-white">
                  {item.symbol}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-gray-500">
                  {item.company_name}
                </span>
                <span className="shrink-0 text-[10px] text-gray-700">{item.symbol_ns}</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Popular chips — shown when no query */}
      {!query && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-gray-600">Popular:</span>
          {POPULAR.map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => navigate(sym)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-xs font-semibold text-gray-400 transition-colors hover:border-[#22d3ee]/40 hover:text-[#22d3ee]"
            >
              {sym}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
