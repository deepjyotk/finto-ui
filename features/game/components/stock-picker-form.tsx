"use client"

import { useState, useRef, useEffect } from "react"
import { X, Check, Search, AlertCircle, Loader2, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  submitPicks,
  submitAnonPicks,
  searchGameStocks,
  type StockSearchResult,
} from "../apis/game-api"

interface StockInputSlotProps {
  index: number
  value: string
  allValues: string[]
  onChange: (val: string) => void
  onClear: () => void
}

function StockInputSlot({ index, value, allValues, onChange, onClear }: StockInputSlotProps) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [searching, setSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<StockSearchResult[]>([])
  const [selectedSymbolNs, setSelectedSymbolNs] = useState<string>(value)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep selected symbol in sync when externally cleared.
  useEffect(() => {
    if (!value) {
      setSelectedSymbolNs("")
      return
    }
    setSelectedSymbolNs(value)
  }, [value])

  // Debounced API search on every keystroke (min 1 character)
  useEffect(() => {
    const q = query.trim()
    if (q.length < 1) {
      setSuggestions([])
      setSearching(false)
      return
    }

    let cancelled = false
    setSearching(true)

    const timer = setTimeout(async () => {
      try {
        const semanticMode = /\s/.test(q)
        const response = await searchGameStocks(q, { limit: 10, semantic: semanticMode })
        if (cancelled) return
        const filtered = response.results.filter(
          (item) => !allValues.includes(item.symbol_ns) || item.symbol_ns === selectedSymbolNs,
        )
        setSuggestions(filtered)
      } catch {
        if (!cancelled) setSuggestions([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, allValues, selectedSymbolNs])

  const isDuplicate = value && allValues.filter(v => v === value).length > 1
  const isLocked = !!selectedSymbolNs

  const handleSelect = (item: StockSearchResult) => {
    setQuery(item.symbol)
    setSelectedSymbolNs(item.symbol_ns)
    onChange(item.symbol_ns)
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.toUpperCase().trimStart()
    setQuery(v)
    if (selectedSymbolNs) {
      setSelectedSymbolNs("")
      onChange("")
    }
    setOpen(true)
  }

  const handleClear = () => {
    setQuery("")
    setSelectedSymbolNs("")
    setSuggestions([])
    onClear()
    setOpen(false)
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors",
          focused
            ? "border-[#22d3ee]/60 bg-[#1a1f2e]"
            : "border-white/10 bg-[#111318]",
          isDuplicate && "border-red-500/60",
          isLocked && !isDuplicate && "border-emerald-500/30",
        )}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-gray-400">
          {index + 1}
        </span>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { setFocused(true); if (query.length >= 1) setOpen(true) }}
          onBlur={() => setFocused(false)}
          placeholder={`Stock ${index + 1} (e.g. RELIANCE)`}
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
          autoComplete="off"
          spellCheck={false}
        />
        {searching && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-500" />}
        {isLocked && !isDuplicate && (
          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
        )}
        {isDuplicate && (
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
        )}
        {query && (
          <button type="button" onClick={handleClear} className="text-gray-500 hover:text-gray-300">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (suggestions.length > 0 || (!searching && query.trim().length >= 1)) && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#1a1f2e] shadow-xl">
          {suggestions.map(item => (
            <button
              key={item.symbol_ns}
              type="button"
              onMouseDown={() => handleSelect(item)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/[0.07] hover:text-white"
            >
              <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500" />
              <span className="min-w-0">
                <span className="block truncate font-medium text-white">{item.symbol}</span>
                <span className="block truncate text-[11px] text-gray-500">{item.company_name}</span>
              </span>
            </button>
          ))}
          {!searching && suggestions.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-500">No matches found</div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

interface StockPickerFormProps {
  onSuccess: (stocks: string[]) => void
  anonConfig?: {
    anonId: string
    displayName: string
    onDisplayNameChange: (name: string) => void
  }
}

export default function StockPickerForm({ onSuccess, anonConfig }: StockPickerFormProps) {
  const [stocks, setStocks] = useState<string[]>(["" ,"", "", "", ""])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState(anonConfig?.displayName ?? "")

  // Keep name input in sync when anonConfig.displayName loads from localStorage
  const prevDisplayName = anonConfig?.displayName
  if (anonConfig && nameInput === "" && prevDisplayName) {
    setNameInput(prevDisplayName)
  }

  const updateStock = (index: number, val: string) => {
    setStocks(prev => prev.map((s, i) => (i === index ? val : s)))
    setError(null)
  }

  const clearStock = (index: number) => {
    setStocks(prev => prev.map((s, i) => (i === index ? "" : s)))
  }

  const filledStocks = stocks.map(s => s.trim().toUpperCase()).filter(Boolean)
  const uniqueFilled = [...new Set(filledStocks)]
  const hasDuplicates = filledStocks.length !== uniqueFilled.length
  const isReady = uniqueFilled.length === 5 && !hasDuplicates

  const handleSubmit = async () => {
    if (!isReady) return
    setSubmitting(true)
    setError(null)
    try {
      let resultStocks: string[]
      if (anonConfig) {
        const finalName = nameInput.trim() || anonConfig.displayName
        anonConfig.onDisplayNameChange(finalName)
        const result = await submitAnonPicks({
          anon_id: anonConfig.anonId,
          display_name: finalName,
          stocks: uniqueFilled,
        })
        resultStocks = result.stocks
      } else {
        const result = await submitPicks({ stocks: uniqueFilled })
        resultStocks = result.stocks
      }
      onSuccess(resultStocks)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit picks")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">Pick Your 5 Stocks</h2>
        <p className="mt-1 text-sm text-gray-400">
          Beat the Nifty 50. Returns calculated from submission price to market close.
        </p>
      </div>

      {/* Display name — anon only */}
      {anonConfig && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400">Your display name</label>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111318] px-3 py-2.5 focus-within:border-[#22d3ee]/50">
            <span className="text-base leading-none">🎮</span>
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onBlur={() => {
                if (nameInput.trim()) anonConfig.onDisplayNameChange(nameInput.trim())
              }}
              placeholder="e.g. TurboTrader42"
              maxLength={30}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
            />
            {nameInput && (
              <span className="text-[10px] text-gray-600">{nameInput.length}/30</span>
            )}
          </div>
          <p className="text-[10px] text-gray-600">This name appears on the leaderboard.</p>
        </div>
      )}

      {/* Inputs */}
      <div className="space-y-2.5">
        {stocks.map((val, i) => (
          <StockInputSlot
            key={i}
            index={i}
            value={val}
            allValues={stocks.map(s => s.trim().toUpperCase()).filter(Boolean)}
            onChange={v => updateStock(i, v)}
            onClear={() => clearStock(i)}
          />
        ))}
      </div>

      {/* Validation hints */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {uniqueFilled.length}/5 stocks selected
        </span>
        {hasDuplicates && (
          <span className="text-red-400 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Duplicate symbols detected
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {error.toLowerCase().includes("market has already opened")
              ? "The server currently requires picks to be submitted before market open. This restriction is being removed — check back soon."
              : error}
          </span>
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!isReady || submitting}
        className={cn(
          "w-full gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
          isReady
            ? "bg-[#22d3ee] text-black hover:bg-[#06b6d4]"
            : "bg-white/5 text-gray-500 cursor-not-allowed"
        )}
      >
        {submitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Locking picks…</>
        ) : (
          <><Send className="h-4 w-4" /> Lock In My Picks</>
        )}
      </Button>

      <p className="text-center text-xs text-gray-600">
        Stock prices are snapshotted at submission time. Returns are calculated from your entry price to market close.
      </p>
    </div>
  )
}
