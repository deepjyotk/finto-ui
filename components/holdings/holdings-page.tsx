"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import useKiteConnection from "@/lib/hooks/use-kite-connection"
import { apiClient } from "@/lib/api/client"
import { Search } from "lucide-react"

type Holding = {
  tradingsymbol?: string
  symbol?: string
  quantity?: number
  qty?: number
  average_price?: number
  avg_price?: number
  avgPrice?: number
  last_price?: number
  ltp?: number
  pnl?: number
}

type Trade = {
  order_id?: string
  tradingsymbol?: string
  exchange?: string
  quantity?: number
  average_price?: number
  filled_quantity?: number
  status?: string
  timestamp?: string
}

export default function HoldingsPage() {
  const router = useRouter()
  const { connected, loading, getLoginUrl, refresh } = useKiteConnection()
  const [holdings, setHoldings] = useState<Holding[] | null>(null)
  const [positions, setPositions] = useState<any>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [symbolInput, setSymbolInput] = useState("")
  const [quoteData, setQuoteData] = useState<any>(null)
  const [ltpData, setLtpData] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      if (!connected) return
      setIsLoading(true)
      setError(null)
      try {
        // Fetch holdings
        const holdingsRes = await apiClient.kiteHoldings()
        const holdingsList = Array.isArray(holdingsRes)
          ? holdingsRes
          : Array.isArray((holdingsRes as any)?.holdings)
          ? (holdingsRes as any).holdings
          : []
        setHoldings(holdingsList)

        // Fetch positions
        const posRes = await apiClient.kitePositions()
        setPositions(posRes)

        // Fetch trades
        const tradesRes = await apiClient.kiteTrades()
        const tradesList = Array.isArray(tradesRes) ? tradesRes : Array.isArray((tradesRes as any)?.data) ? (tradesRes as any).data : []
        setTrades(tradesList)
      } catch (e: any) {
        setError(e?.message || "Failed to fetch data")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [connected])

  const handleFetchQuote = async () => {
    if (!symbolInput.trim()) return
    try {
      const data = await apiClient.kiteQuote(symbolInput.toUpperCase())
      setQuoteData(data)
    } catch (e: any) {
      setError(e?.message || "Failed to fetch quote")
    }
  }

  const handleFetchLtp = async () => {
    if (!symbolInput.trim()) return
    try {
      const data = await apiClient.kiteLtp(symbolInput.toUpperCase())
      setLtpData(data)
    } catch (e: any) {
      setError(e?.message || "Failed to fetch LTP")
    }
  }

  if (loading) return <div className="p-6">Checking connection…</div>

  if (!connected) {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-4">
        <h1 className="text-xl font-semibold">Holdings & Positions</h1>
        <p className="text-sm text-gray-600">Your Kite account is not connected.</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => (window.location.href = getLoginUrl())}>Connect Kite</Button>
          <Button variant="outline" size="sm" onClick={() => refresh()}>Refresh</Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Holdings & Positions</h1>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => window.location.reload()} disabled={isLoading}>
            {isLoading ? "Loading…" : "Refresh"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => router.push("/")}>Home</Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded">{error}</div>}

      <Tabs defaultValue="holdings" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="quotes">Quote & LTP</TabsTrigger>
        </TabsList>

        {/* Holdings Tab */}
        <TabsContent value="holdings" className="space-y-4">
          <HoldingsTable holdings={holdings} />
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions" className="space-y-4">
          <PositionsView positions={positions} />
        </TabsContent>

        {/* Trades Tab */}
        <TabsContent value="trades" className="space-y-4">
          <TradesTable trades={trades} />
        </TabsContent>

        {/* Quote & LTP Tab */}
        <TabsContent value="quotes" className="space-y-4">
          <QuoteView symbolInput={symbolInput} setSymbolInput={setSymbolInput} onFetchQuote={handleFetchQuote} onFetchLtp={handleFetchLtp} quoteData={quoteData} ltpData={ltpData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function HoldingsTable({ holdings }: { holdings: Holding[] | null }) {
  if (!holdings || holdings.length === 0) {
    return <div className="p-4 text-center text-gray-600">No holdings found.</div>
  }

  return (
    <div className="overflow-x-auto rounded border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm text-gray-900">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            <th className="p-3 text-left">Symbol</th>
            <th className="p-3 text-right">Qty</th>
            <th className="p-3 text-right">Avg Price</th>
            <th className="p-3 text-right">LTP</th>
            <th className="p-3 text-right">P/L</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h, i) => {
            const symbol = h.tradingsymbol || h.symbol || "—"
            const qty = Number(h.quantity ?? h.qty ?? 0)
            const avg = Number(h.average_price ?? h.avg_price ?? h.avgPrice ?? 0)
            const ltp = Number(h.last_price ?? h.ltp ?? 0)
            const pl = (ltp - avg) * qty
            return (
              <tr key={`${symbol}-${i}`} className={i % 2 ? "bg-gray-50" : "bg-white"}>
                <td className="p-3 font-medium">{symbol}</td>
                <td className="p-3 text-right">{qty}</td>
                <td className="p-3 text-right">₹{avg.toFixed(2)}</td>
                <td className="p-3 text-right">₹{ltp.toFixed(2)}</td>
                <td className={`p-3 text-right font-medium ${pl >= 0 ? "text-cyan-600" : "text-red-600"}`}>
                  {pl >= 0 ? "+" : ""}₹{pl.toFixed(2)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function PositionsView({ positions }: { positions: any }) {
  if (!positions) {
    return <div className="p-4 text-center text-gray-600">No positions data available.</div>
  }

  const allPositions = [...(positions?.net || []), ...(positions?.day || [])]
  const uniquePositions = Array.from(new Map(allPositions.map((p: any) => [p.tradingsymbol, p])).values())

  if (uniquePositions.length === 0) {
    return <div className="p-4 text-center text-gray-600">No open positions.</div>
  }

  return (
    <div className="overflow-x-auto rounded border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm text-gray-900">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            <th className="p-3 text-left">Symbol</th>
            <th className="p-3 text-left">Exchange</th>
            <th className="p-3 text-right">Qty</th>
            <th className="p-3 text-right">Avg Price</th>
            <th className="p-3 text-right">LTP</th>
            <th className="p-3 text-right">Value</th>
            <th className="p-3 text-right">P/L</th>
          </tr>
        </thead>
        <tbody>
          {uniquePositions.map((p: any, i: number) => {
            const qty = Number(p.quantity ?? 0)
            const avg = Number(p.average_price ?? 0)
            const ltp = Number(p.last_price ?? 0)
            const pnl = Number(p.pnl ?? 0)
            return (
              <tr key={`${p.tradingsymbol}-${i}`} className={i % 2 ? "bg-gray-50" : "bg-white"}>
                <td className="p-3 font-medium">{p.tradingsymbol}</td>
                <td className="p-3">{p.exchange}</td>
                <td className="p-3 text-right">{qty}</td>
                <td className="p-3 text-right">₹{avg.toFixed(2)}</td>
                <td className="p-3 text-right">₹{ltp.toFixed(2)}</td>
                <td className="p-3 text-right">₹{Number(p.value ?? 0).toFixed(2)}</td>
                <td className={`p-3 text-right font-medium ${pnl >= 0 ? "text-cyan-600" : "text-red-600"}`}>
                  {pnl >= 0 ? "+" : ""}₹{pnl.toFixed(2)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TradesTable({ trades }: { trades: Trade[] }) {
  if (!trades || trades.length === 0) {
    return <div className="p-4 text-center text-gray-600">No trades found.</div>
  }

  return (
    <div className="overflow-x-auto rounded border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm text-gray-900">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            <th className="p-3 text-left">Symbol</th>
            <th className="p-3 text-left">Exchange</th>
            <th className="p-3 text-right">Qty</th>
            <th className="p-3 text-right">Price</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Time</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => (
            <tr key={`${t.order_id}-${i}`} className={i % 2 ? "bg-gray-50" : "bg-white"}>
              <td className="p-3 font-medium">{t.tradingsymbol}</td>
              <td className="p-3">{t.exchange}</td>
              <td className="p-3 text-right">{Number(t.filled_quantity ?? 0)}</td>
              <td className="p-3 text-right">₹{Number(t.average_price ?? 0).toFixed(2)}</td>
              <td className={`p-3 text-sm ${t.status === "COMPLETE" ? "text-cyan-600" : t.status === "CANCELLED" ? "text-red-600" : "text-yellow-600"}`}>
                {t.status}
              </td>
              <td className="p-3 text-xs">{t.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function QuoteView({
  symbolInput,
  setSymbolInput,
  onFetchQuote,
  onFetchLtp,
  quoteData,
  ltpData,
}: {
  symbolInput: string
  setSymbolInput: (s: string) => void
  onFetchQuote: () => void
  onFetchLtp: () => void
  quoteData: any
  ltpData: any
}) {
  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Enter symbol (e.g. NSE:INFY, BSE:SENSEX)"
          value={symbolInput}
          onChange={(e) => setSymbolInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onFetchQuote()}
          className="flex-1"
        />
        <Button onClick={onFetchQuote} size="sm" className="gap-2">
          <Search className="h-4 w-4" /> Quote
        </Button>
        <Button onClick={onFetchLtp} size="sm" variant="outline">
          LTP
        </Button>
      </div>

      {/* Quote Data */}
      {quoteData && (
        <div className="rounded border border-gray-200 bg-white p-4">
          <h3 className="font-semibold mb-4 text-gray-900">Quote Data</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(quoteData).map(([key, val]: [string, any]) => (
              <div key={key} className="border rounded p-3 bg-gray-50">
                <div className="text-xs text-gray-600 uppercase">{key}</div>
                <div className="text-lg font-bold text-gray-900 mt-1">
                  {typeof val === "object" ? JSON.stringify(val, null, 2) : String(val)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LTP Data */}
      {ltpData && (
        <div className="rounded border border-gray-200 bg-white p-4">
          <h3 className="font-semibold mb-4 text-gray-900">Last Traded Price</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(ltpData).map(([key, val]: [string, any]) => (
              <div key={key} className="border rounded p-3 bg-gray-50">
                <div className="text-sm font-medium text-gray-700">{key}</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {val?.last_price ? `₹${Number(val.last_price).toFixed(2)}` : "N/A"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
