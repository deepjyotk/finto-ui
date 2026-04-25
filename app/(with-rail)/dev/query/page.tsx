"use client"

import { FormEvent, useMemo, useState } from "react"
import { apiClient } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type DevPriceBarRow = {
  symbol: string
  company_name: string
  open: string | number | null
  high: string | number | null
  low: string | number | null
  close: string | number | null
  volume: number | null
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function fmt(v: string | number | null): string {
  return v === null || v === undefined ? "-" : String(v)
}

export default function DevQueryPage() {
  const [symbol, setSymbol] = useState("RELIANCE")
  const [tradeDate, setTradeDate] = useState(todayIsoDate())
  const [row, setRow] = useState<DevPriceBarRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const endpoint = useMemo(() => {
    const q = new URLSearchParams({
      symbol: symbol.trim(),
      trade_date: tradeDate,
    })
    return `/api/v1/dev/query/price-bar?${q.toString()}`
  }, [symbol, tradeDate])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setRow(null)

    try {
      const data = await apiClient.request<DevPriceBarRow | null>(endpoint, {
        method: "GET",
      })
      setRow(data)
      if (!data) {
        setError("No row found for the given symbol and trade date.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 text-white">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Dev helper</p>
        <h1 className="mt-1 text-2xl font-semibold">/dev/query</h1>
        <p className="mt-1 text-sm text-gray-400">
          Query one OHLCV row by joining <code>in_equities</code> and <code>price_bars_1d</code>.
        </p>
      </div>

      <form onSubmit={onSubmit} className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end">
          <div className="space-y-1">
            <label htmlFor="symbol" className="text-sm text-gray-300">
              Symbol
            </label>
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="RELIANCE"
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="trade-date" className="text-sm text-gray-300">
              Trade date
            </label>
            <Input
              id="trade-date"
              type="date"
              value={tradeDate}
              onChange={(e) => setTradeDate(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Running..." : "Run query"}
          </Button>
        </div>
      </form>

      <div className="rounded-lg border border-white/10 bg-[#0F1419] p-4">
        <p className="mb-2 text-sm text-gray-400">Backend endpoint</p>
        <code className="block overflow-x-auto rounded bg-black/30 p-2 text-xs">{endpoint}</code>
      </div>

      {error ? <p className="text-sm text-amber-300">{error}</p> : null}

      {row ? (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-gray-300">
              <tr>
                <th className="px-3 py-2">Symbol</th>
                <th className="px-3 py-2">Company Name</th>
                <th className="px-3 py-2">Open</th>
                <th className="px-3 py-2">High</th>
                <th className="px-3 py-2">Low</th>
                <th className="px-3 py-2">Close</th>
                <th className="px-3 py-2">Volume</th>
                <th className="px-3 py-2">External websites</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-white/10">
                <td className="px-3 py-2">{row.symbol}</td>
                <td className="px-3 py-2">{row.company_name}</td>
                <td className="px-3 py-2">{fmt(row.open)}</td>
                <td className="px-3 py-2">{fmt(row.high)}</td>
                <td className="px-3 py-2">{fmt(row.low)}</td>
                <td className="px-3 py-2">{fmt(row.close)}</td>
                <td className="px-3 py-2">{fmt(row.volume)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-1">
                    <a
                      href="https://www.investing.com/equities"
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-300 hover:text-cyan-200 hover:underline"
                    >
                      investing.com
                    </a>
                    <a
                      href="https://www.nseindia.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-300 hover:text-cyan-200 hover:underline"
                    >
                      nseindia.com
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
