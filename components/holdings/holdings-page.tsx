"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import useKiteConnection from "@/features/integrations/hooks/use-kite-connection"
import { apiClient } from "@/lib/api/client"
import { Search, RefreshCw, Check, X, AlertCircle } from "lucide-react"
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community'
import type { ColDef } from 'ag-grid-community'
import { C1Component, ThemeProvider } from "@thesysai/genui-sdk"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

// Check if Thesys is enabled
const isThesysEnabled =
  (process.env.NEXT_PUBLIC_THESYS_ENABLED ?? "true").toLowerCase() === "true"

// Thesys theme configuration
const thesysDarkTheme = {
  chatContainerBg: "transparent",
  chatAssistantResponseBg: "transparent",
  chatAssistantResponseText: "var(--color-foreground)",
  chatUserResponseBg: "var(--color-secondary)",
  chatUserResponseText: "var(--color-secondary-foreground)",
  interactiveAccent: "var(--color-secondary)",
  interactiveAccentHover: "var(--color-secondary-hover)",
  interactiveAccentPressed: "var(--color-secondary-pressed)",
  interactiveAccentDisabled: "var(--color-secondary-disabled)",
}

// Custom dark theme matching the app's color scheme
const darkTheme = themeQuartz.withParams({
  backgroundColor: 'oklch(0.145 0 0)',
  foregroundColor: 'oklch(0.985 0 0)',
  borderColor: 'oklch(0.269 0 0)',
  headerBackgroundColor: 'oklch(0.205 0 0)',
  headerTextColor: 'oklch(0.985 0 0)',
  oddRowBackgroundColor: 'oklch(0.145 0 0)',
  rowHoverColor: 'oklch(0.269 0 0)',
  accentColor: '#22d3ee',
  spacing: 8,
  borderRadius: 8,
})

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

type SyncStatus = {
  success: boolean
  message: string
  synced_count?: number
  updated_count?: number
  last_sync?: string
}

export default function HoldingsPageClient() {
  const router = useRouter()
  const { connected, loading, getLoginUrl, refresh } = useKiteConnection()
  
  // Sync state
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
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

        // Fetch last sync status
        await fetchSyncStatus()
      } catch (e: any) {
        setError(e?.message || "Failed to fetch data")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [connected])

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/holdings/sync/status')
      if (response.ok) {
        const data = await response.json()
        if (data.last_sync) {
          setLastSyncTime(data.last_sync)
        }
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error)
    }
  }

  const handleSync = async () => {
    if (!holdings || holdings.length === 0) {
      setSyncStatus({
        success: false,
        message: 'No holdings to sync'
      })
      return
    }

    setIsSyncing(true)
    setSyncStatus(null)
    setError(null)

    try {
      const response = await fetch('/api/holdings/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          broker_name: 'Zerodha',
          holdings: holdings
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync holdings')
      }

      setSyncStatus({
        success: true,
        message: `Synced ${data.synced_count || 0} new, updated ${data.updated_count || 0} existing holdings`,
        synced_count: data.synced_count,
        updated_count: data.updated_count,
        last_sync: data.last_sync
      })

      setLastSyncTime(data.last_sync)

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSyncStatus(null)
      }, 5000)

    } catch (error: any) {
      setSyncStatus({
        success: false,
        message: error.message || 'Failed to sync holdings'
      })
      setError(error.message || 'Failed to sync holdings')
    } finally {
      setIsSyncing(false)
    }
  }

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
    <div className="p-6 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Holdings & Positions</h1>
          {lastSyncTime && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Last synced: {new Date(lastSyncTime).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2 items-center">
          {/* Sync Status Message */}
          {syncStatus && !isSyncing && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm animate-in fade-in slide-in-from-top-2 ${
              syncStatus.success 
                ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              {syncStatus.success ? (
                <Check className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{syncStatus.message}</span>
            </div>
          )}
          
          {/* Sync Button */}
          <Button 
            size="sm" 
            onClick={handleSync} 
            disabled={isSyncing || isLoading || !holdings || holdings.length === 0}
            className="gap-2"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync to DB'}
          </Button>

          <Button size="sm" onClick={() => window.location.reload()} disabled={isLoading}>
            {isLoading ? "Loading…" : "Refresh"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => router.push("/")}>Home</Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded flex items-center gap-2">
          <X className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left side - Portfolio grids (3/4 width) */}
        <div className="w-3/4 flex flex-col overflow-hidden">
          <Tabs defaultValue="holdings" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
              <TabsTrigger value="positions">Positions</TabsTrigger>
              <TabsTrigger value="trades">Trades</TabsTrigger>
              <TabsTrigger value="quotes">Quote & LTP</TabsTrigger>
            </TabsList>

            {/* Holdings Tab */}
            <TabsContent value="holdings" className="flex-1 overflow-hidden">
              <HoldingsTable holdings={holdings} />
            </TabsContent>

            {/* Positions Tab */}
            <TabsContent value="positions" className="flex-1 overflow-hidden">
              <PositionsView positions={positions} />
            </TabsContent>

            {/* Trades Tab */}
            <TabsContent value="trades" className="flex-1 overflow-hidden">
              <TradesTable trades={trades} />
            </TabsContent>

            {/* Quote & LTP Tab */}
            <TabsContent value="quotes" className="flex-1 overflow-hidden">
              <QuoteView symbolInput={symbolInput} setSymbolInput={setSymbolInput} onFetchQuote={handleFetchQuote} onFetchLtp={handleFetchLtp} quoteData={quoteData} ltpData={ltpData} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right side - Chat interface (1/4 width) */}
        <div className="w-1/4 flex flex-col border-l border-white/10 pl-4">
          <h2 className="text-xl font-semibold mb-4">AI Assistant</h2>
          <div className="flex-1 overflow-hidden">
            <PortfolioChatWidget />
          </div>
        </div>
      </div>
    </div>
  )
}

function HoldingsTable({ holdings }: { holdings: Holding[] | null }) {
  const columnDefs: ColDef<Holding>[] = useMemo(() => [
    { 
      field: 'tradingsymbol', 
      headerName: 'Symbol',
      filter: 'agTextColumnFilter',
      flex: 1,
      valueGetter: (params) => params.data?.tradingsymbol || params.data?.symbol || '—'
    },
    { 
      field: 'quantity', 
      headerName: 'Qty',
      filter: 'agNumberColumnFilter',
      type: 'rightAligned',
      valueGetter: (params) => Number(params.data?.quantity ?? params.data?.qty ?? 0)
    },
    { 
      field: 'average_price', 
      headerName: 'Avg Price',
      filter: 'agNumberColumnFilter',
      type: 'rightAligned',
      valueFormatter: (params) => `₹${Number(params.value ?? 0).toFixed(2)}`,
      valueGetter: (params) => Number(params.data?.average_price ?? params.data?.avg_price ?? params.data?.avgPrice ?? 0)
    },
    { 
      field: 'last_price', 
      headerName: 'LTP',
      filter: 'agNumberColumnFilter',
      type: 'rightAligned',
      valueFormatter: (params) => `₹${Number(params.value ?? 0).toFixed(2)}`,
      valueGetter: (params) => Number(params.data?.last_price ?? params.data?.ltp ?? 0)
    },
    { 
      field: 'pnl', 
      headerName: 'P/L',
      filter: 'agNumberColumnFilter',
      type: 'rightAligned',
      valueFormatter: (params) => {
        const val = Number(params.value ?? 0);
        return `${val >= 0 ? '+' : ''}₹${val.toFixed(2)}`;
      },
      valueGetter: (params) => {
        const qty = Number(params.data?.quantity ?? params.data?.qty ?? 0);
        const avg = Number(params.data?.average_price ?? params.data?.avg_price ?? params.data?.avgPrice ?? 0);
        const ltp = Number(params.data?.last_price ?? params.data?.ltp ?? 0);
        return (ltp - avg) * qty;
      },
      cellStyle: (params) => {
        const val = Number(params.value ?? 0);
        return val >= 0 ? { color: '#0891b2', fontWeight: '600' } : { color: '#dc2626', fontWeight: '600' };
      }
    },
  ], []);

  if (!holdings || holdings.length === 0) {
    return <div className="p-4 text-center text-gray-600">No holdings found.</div>
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <AgGridReact
        theme={darkTheme}
        rowData={holdings}
        columnDefs={columnDefs}
        defaultColDef={{
          sortable: true,
          filter: true,
          resizable: true,
        }}
        pagination={true}
        paginationPageSize={20}
        domLayout='normal'
      />
    </div>
  )
}

function PositionsView({ positions }: { positions: any }) {
  const columnDefs: ColDef[] = useMemo(() => [
    { 
      field: 'tradingsymbol', 
      headerName: 'Symbol',
      filter: 'agTextColumnFilter',
      flex: 1
    },
    { 
      field: 'exchange', 
      headerName: 'Exchange',
      filter: 'agTextColumnFilter',
      width: 120
    },
    { 
      field: 'quantity', 
      headerName: 'Qty',
      filter: 'agNumberColumnFilter',
      type: 'rightAligned',
      valueFormatter: (params) => Number(params.value ?? 0).toString()
    },
    { 
      field: 'average_price', 
      headerName: 'Avg Price',
      filter: 'agNumberColumnFilter',
      type: 'rightAligned',
      valueFormatter: (params) => `₹${Number(params.value ?? 0).toFixed(2)}`
    },
    { 
      field: 'last_price', 
      headerName: 'LTP',
      filter: 'agNumberColumnFilter',
      type: 'rightAligned',
      valueFormatter: (params) => `₹${Number(params.value ?? 0).toFixed(2)}`
    },
    { 
      field: 'value', 
      headerName: 'Value',
      filter: 'agNumberColumnFilter',
      type: 'rightAligned',
      valueFormatter: (params) => `₹${Number(params.value ?? 0).toFixed(2)}`
    },
    { 
      field: 'pnl', 
      headerName: 'P/L',
      filter: 'agNumberColumnFilter',
      type: 'rightAligned',
      valueFormatter: (params) => {
        const val = Number(params.value ?? 0);
        return `${val >= 0 ? '+' : ''}₹${val.toFixed(2)}`;
      },
      cellStyle: (params) => {
        const val = Number(params.value ?? 0);
        return val >= 0 ? { color: '#0891b2', fontWeight: '600' } : { color: '#dc2626', fontWeight: '600' };
      }
    },
  ], []);

  if (!positions) {
    return <div className="p-4 text-center text-gray-600">No positions data available.</div>
  }

  const allPositions = [...(positions?.net || []), ...(positions?.day || [])]
  const uniquePositions = Array.from(new Map(allPositions.map((p: any) => [p.tradingsymbol, p])).values())

  if (uniquePositions.length === 0) {
    return <div className="p-4 text-center text-gray-600">No open positions.</div>
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <AgGridReact
        theme={darkTheme}
        rowData={uniquePositions}
        columnDefs={columnDefs}
        defaultColDef={{
          sortable: true,
          filter: true,
          resizable: true,
        }}
        pagination={true}
        paginationPageSize={20}
        domLayout='normal'
      />
    </div>
  )
}

function TradesTable({ trades }: { trades: Trade[] }) {
  const columnDefs: ColDef<Trade>[] = useMemo(() => [
    { 
      field: 'tradingsymbol', 
      headerName: 'Symbol',
      filter: 'agTextColumnFilter',
      flex: 1
    },
    { 
      field: 'exchange', 
      headerName: 'Exchange',
      filter: 'agTextColumnFilter',
      width: 120
    },
    { 
      field: 'filled_quantity', 
      headerName: 'Qty',
      filter: 'agNumberColumnFilter',
      type: 'rightAligned',
      valueFormatter: (params) => Number(params.value ?? 0).toString()
    },
    { 
      field: 'average_price', 
      headerName: 'Price',
      filter: 'agNumberColumnFilter',
      type: 'rightAligned',
      valueFormatter: (params) => `₹${Number(params.value ?? 0).toFixed(2)}`
    },
    { 
      field: 'status', 
      headerName: 'Status',
      filter: 'agTextColumnFilter',
      width: 130,
      cellStyle: (params) => {
        const status = params.value;
        if (status === 'COMPLETE') return { color: '#0891b2', fontSize: '0.875rem' };
        if (status === 'CANCELLED') return { color: '#dc2626', fontSize: '0.875rem' };
        return { color: '#ca8a04', fontSize: '0.875rem' };
      }
    },
    { 
      field: 'timestamp', 
      headerName: 'Time',
      filter: 'agTextColumnFilter',
      width: 180,
      cellStyle: { fontSize: '0.75rem' }
    },
  ], []);

  if (!trades || trades.length === 0) {
    return <div className="p-4 text-center text-gray-600">No trades found.</div>
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <AgGridReact
        theme={darkTheme}
        rowData={trades}
        columnDefs={columnDefs}
        defaultColDef={{
          sortable: true,
          filter: true,
          resizable: true,
        }}
        pagination={true}
        paginationPageSize={20}
        domLayout='normal'
      />
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

function PortfolioChatWidget() {
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: input.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/proxy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          context: 'portfolio'
        })
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()
      
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: data.response || 'No response received'
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#1a1b23] rounded-lg border border-white/10">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm text-center px-4">
            Ask me anything about your portfolio, stocks, or market insights!
          </div>
        ) : (
          <ThemeProvider mode="dark" theme={thesysDarkTheme} darkTheme={thesysDarkTheme}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'user' ? (
                  <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-cyan-500/20 text-cyan-100 border border-cyan-500/30">
                    {message.content}
                  </div>
                ) : (
                  <div className="w-full rounded-lg px-2 py-2 text-sm bg-white/5 border border-white/10">
                    {isThesysEnabled ? (
                      <div className="prose prose-invert prose-sm max-w-none prose-headings:font-semibold prose-headings:text-sm prose-p:text-xs prose-p:text-gray-200 prose-a:text-cyan-400 prose-strong:text-white prose-table:text-xs">
                        <C1Component
                          c1Response={message.content}
                          isStreaming={false}
                        />
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none prose-headings:font-semibold prose-headings:text-sm prose-p:text-xs prose-p:text-gray-200 prose-a:text-cyan-400 prose-strong:text-white">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </ThemeProvider>
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-white/5 text-gray-400 border border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask about your portfolio..."
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="sm"
            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 border border-cyan-500/30"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
