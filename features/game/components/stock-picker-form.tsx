"use client"

import { useState, useRef, useEffect } from "react"
import { X, Check, Search, AlertCircle, Loader2, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { submitPicks, submitAnonPicks } from "../apis/game-api"

// Top Nifty 200 symbols for autocomplete
const NIFTY_200_SYMBOLS = [
  "RELIANCE","TCS","HDFCBANK","INFY","ICICIBANK","HINDUNILVR","SBIN","BHARTIARTL","ITC","KOTAKBANK",
  "LT","AXISBANK","ASIANPAINT","BAJFINANCE","MARUTI","HCLTECH","SUNPHARMA","TITAN","WIPRO","ULTRACEMCO",
  "BAJAJFINSV","ONGC","NTPC","POWERGRID","TECHM","NESTLEIND","TATAMOTORS","ADANIPORTS","DRREDDY","DIVISLAB",
  "CIPLA","EICHERMOT","BPCL","HEROMOTOCO","COALINDIA","JSWSTEEL","TATACONSUM","GRASIM","INDUSINDBK","BRITANNIA",
  "HINDALCO","TATASTEEL","ADANIENT","BAJAJ-AUTO","APOLLOHOSP","SBILIFE","HDFCLIFE","UPL","PIDILITIND","DMART",
  "SIEMENS","HAVELLS","DABUR","COLPAL","MCDOWELL-N","PGHH","BERGEPAINT","AMBUJACEM","ABB","BOSCHLTD",
  "BANDHANBNK","BANKBARODA","CANBK","PNB","UNIONBANK","IDBI","FEDERALBNK","IDFCFIRSTB","RBLBANK","YESBANK",
  "LTM","LTTS","MINDTREE","MPHASIS","PERSISTENT","COFORGE","NIITTECH","HEXAWARE","OFSS","KPIT",
  "GAIL","IOC","HINDPETRO","MRPL","PETRONET","GUJALN","CONCOR","IRFC","RAILVIKAS","RVNL",
  "TRENT","NYKAA","ZOMATO","PAYTM","POLICYBZR","DEVYANI","SAPPHIRE","JUBLFOOD","WESTLIFE","BURGER",
  "GODREJPROP","OBEROIRLTY","PRESTIGE","SOBHA","MAHINDCIE","ASHOKLEY","ESCORTS","TVSMOTOR","BALKRISIND","MRF",
  "AUROPHARMA","TORNTPHARM","GLENMARK","ALKEM","BIOCON","LALPATHLAB","METROPOLIS","MAXHEALTH","FORTIS","ASTER",
  "SHREECEM","ACC","RAMCOCEM","DALMIACEMT","HEIDELBERG","JKCEMENT","ORIENTCEM","NUVOCO","BIRLACORPN","PRISMJOH",
  "SUNTV","ZEEL","PVR","INOX","SAREGAMA","TIPS","NAZARA","DELTACORP","PLAYMATE","WONDERLA",
  "MUTHOOTFIN","BAJAJHLDNG","CHOLAFIN","MANAPPURAM","IIFL","M&MFIN","SHRIRAMFIN","LICHSGFIN","CANFINHOME","PNBHOUSING",
  "SRF","ATUL","VINATI","DEEPAKNTR","NAVINFLUOR","FINEORG","GALAXYSURF","TATACHEM","GNFC","AAVAS",
  "SYNGENE","DIVI","LAURUSLABS","GRANULES","IPCA","NATCOPHARM","PFIZER","ABBOTINDIA","GLAXO","SANOFI",
  "ADANIGREEN","ADANITRANS","TATAPOWER","JSW ENERGY","CESC","TORNTPOWER","NHPC","SJVN","GMRINFRA","IRIFC",
  "PAGEIND","WHIRLPOOL","VOLTAS","BLUESTARCO","CROMPTON","SYSKA","POLYCAB","FINOLEX","BELDEN","KEI",
]

interface StockInputSlotProps {
  index: number
  value: string
  allValues: string[]
  onChange: (val: string) => void
  onClear: () => void
}

function StockInputSlot({ index, value, allValues, onChange, onClear }: StockInputSlotProps) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep input in sync when value is cleared externally
  useEffect(() => { setQuery(value) }, [value])

  const suggestions = query.trim().length >= 1
    ? NIFTY_200_SYMBOLS.filter(
        s => s.includes(query.toUpperCase()) && !allValues.includes(s)
      ).slice(0, 8)
    : []

  const isDuplicate = value && allValues.filter(v => v === value).length > 1
  const isLocked = !!value

  const handleSelect = (sym: string) => {
    setQuery(sym)
    onChange(sym)
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.toUpperCase()
    setQuery(v)
    onChange(v)
    setOpen(true)
  }

  const handleClear = () => {
    setQuery("")
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
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#1a1f2e] shadow-xl">
          {suggestions.map(sym => (
            <button
              key={sym}
              type="button"
              onMouseDown={() => handleSelect(sym)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/[0.07] hover:text-white"
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-gray-500" />
              {sym}
            </button>
          ))}
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
