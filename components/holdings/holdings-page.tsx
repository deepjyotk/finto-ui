"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import useKiteConnection from "@/lib/hooks/use-kite-connection"
import { kiteHoldings } from "@/lib/api/integrations_api"

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

export default function HoldingsPage() {
  const router = useRouter()
  const { connected, loading, getLoginUrl, refresh } = useKiteConnection()
  const [holdings, setHoldings] = useState<Holding[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!connected) return
      setIsLoading(true)
      setError(null)
      try {
        const data = await kiteHoldings()
        const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.holdings) ? (data as any).holdings : [])
        setHoldings(list)
      } catch (e: any) {
        setError(e?.message || "Failed to fetch holdings")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [connected])

  if (loading) return <div className="p-6">Checking connection…</div>

  if (!connected) {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-4">
        <h1 className="text-xl font-semibold">Holdings</h1>
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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Holdings</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { if (typeof router.refresh === "function") { router.refresh() } else { window.location.reload() } }}>Refresh</Button>
          <Button size="sm" variant="ghost" onClick={() => router.push("/")}>Home</Button>
        </div>
      </div>

      {isLoading && <div className="text-sm text-gray-600 mb-2">Loading holdings…</div>}
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

      <div className="overflow-x-auto rounded border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm text-gray-900">
          <thead className="bg-gray-50 text-gray-700">
            <tr className="text-left">
              <th className="p-2 border-b">Symbol</th>
              <th className="p-2 border-b">Qty</th>
              <th className="p-2 border-b">Avg Price</th>
              <th className="p-2 border-b">LTP</th>
              <th className="p-2 border-b">P/L</th>
            </tr>
          </thead>
          <tbody>
            {(holdings || []).map((h, i) => {
              const symbol = h.tradingsymbol || h.symbol || "-"
              const qty = (h.quantity ?? h.qty ?? 0) as number
              const avg = (h.average_price ?? h.avg_price ?? h.avgPrice ?? 0) as number
              const ltp = (h.last_price ?? h.ltp ?? 0) as number
              const pl = (ltp - avg) * qty
              return (
                <tr key={`${symbol}-${i}`} className={i % 2 ? "bg-gray-50" : "bg-white"}>
                  <td className="p-2 font-medium text-gray-900">{symbol}</td>
                  <td className="p-2 text-gray-900">{qty}</td>
                  <td className="p-2 text-gray-900">₹{avg.toFixed(2)}</td>
                  <td className="p-2 text-gray-900">₹{ltp.toFixed(2)}</td>
                  <td className={`p-2 ${pl >= 0 ? "text-green-600" : "text-red-600"}`}>{pl >= 0 ? "+" : ""}₹{pl.toFixed(2)}</td>
                </tr>
              )
            })}
            {!isLoading && (!holdings || holdings.length === 0) && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-600">No holdings found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
