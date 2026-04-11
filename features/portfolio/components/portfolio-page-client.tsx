"use client"

import { useEffect, useMemo, useState } from "react"
import { AgGridReact } from "ag-grid-react"
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community"
import type { ColDef } from "ag-grid-community"
import { Eye, EyeOff, RefreshCw, TrendingDown, TrendingUp, Wallet } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

import { getHoldingsMetadata } from "@/features/integrations/apis/integrations-api"
import type { PortfolioUpdates } from "@/features/integrations/apis/integrations-api"
import { getPortfolio } from "../apis/portfolio-api"
import type { PortfolioHoldingItem, PortfolioResponse } from "../apis/portfolio-api"

// Register AG Grid modules once
ModuleRegistry.registerModules([AllCommunityModule])

// ── AG Grid dark theme tuned to match the app colour palette ──────────────
const portfolioGridTheme = themeQuartz.withParams({
  backgroundColor: "oklch(0.145 0 0)",
  foregroundColor: "oklch(0.985 0 0)",
  borderColor: "oklch(0.269 0 0)",
  headerBackgroundColor: "oklch(0.205 0 0)",
  headerTextColor: "oklch(0.75 0 0)",
  oddRowBackgroundColor: "oklch(0.145 0 0)",
  rowHoverColor: "oklch(0.205 0 0)",
  accentColor: "#22d3ee",
  fontSize: 13,
  spacing: 10,
  borderRadius: 10,
})

// ── Formatters ─────────────────────────────────────────────────────────────

const fmtCurrency = (val: number | null | undefined) => {
  if (val == null) return "—"
  return `₹${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const fmtPercent = (val: number | null | undefined) => {
  if (val == null) return "—"
  const n = Number(val)
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`
}

const pnlCellStyle = (params: { value: number | null }) => {
  const val = Number(params.value ?? 0)
  return {
    color: val >= 0 ? "#22d3ee" : "#f87171",
    fontWeight: "600",
  }
}

// ── Column definitions ─────────────────────────────────────────────────────

function buildColumnDefs(): ColDef<PortfolioHoldingItem>[] {
  return [
    {
      field: "company_name",
      headerName: "Company",
      flex: 2,
      minWidth: 220,
      filter: "agTextColumnFilter",
      cellClass: "overflow-visible",
      cellRenderer: (params: { data: PortfolioHoldingItem }) => {
        const d = params.data
        return (
          <div className="flex flex-col justify-center h-full py-2">
            <span className="font-semibold text-[13px] text-[oklch(0.985_0_0)] leading-5">
              {d.company_name}
            </span>
            {d.sector && (
              <span className="text-[11px] text-[oklch(0.556_0_0)] leading-4">
                {d.sector}
              </span>
            )}
          </div>
        )
      },
    },
    {
      field: "weight_percent",
      headerName: "Weight",
      width: 110,
      type: "rightAligned",
      filter: "agNumberColumnFilter",
      valueFormatter: (p) => `${Number(p.value ?? 0).toFixed(2)}%`,
    },
    {
      field: "ltp",
      headerName: "LTP",
      width: 130,
      type: "rightAligned",
      filter: "agNumberColumnFilter",
      valueFormatter: (p) => fmtCurrency(p.value),
    },
    {
      field: "avg_price",
      headerName: "Avg Price",
      width: 140,
      type: "rightAligned",
      filter: "agNumberColumnFilter",
      valueFormatter: (p) => fmtCurrency(p.value),
    },
    {
      field: "qty_available",
      headerName: "Qty",
      width: 90,
      type: "rightAligned",
      filter: "agNumberColumnFilter",
    },
    {
      field: "investment_value",
      headerName: "Invested",
      width: 150,
      type: "rightAligned",
      filter: "agNumberColumnFilter",
      valueFormatter: (p) => fmtCurrency(p.value),
    },
    {
      field: "current_value",
      headerName: "Current Value",
      width: 160,
      type: "rightAligned",
      filter: "agNumberColumnFilter",
      valueFormatter: (p) => fmtCurrency(p.value),
    },
    {
      field: "pnl_absolute",
      headerName: "P&L",
      width: 150,
      type: "rightAligned",
      filter: "agNumberColumnFilter",
      valueFormatter: (p) => {
        const val = Number(p.value ?? 0)
        return `${val >= 0 ? "+" : ""}${fmtCurrency(val)}`
      },
      cellStyle: pnlCellStyle,
    },
    {
      field: "pnl_percent",
      headerName: "P&L %",
      width: 120,
      type: "rightAligned",
      filter: "agNumberColumnFilter",
      valueFormatter: (p) => fmtPercent(p.value),
      cellStyle: pnlCellStyle,
    },
  ]
}

// ── Summary card ───────────────────────────────────────────────────────────

const MASKED_CURRENCY = "₹ ••••••••••"

interface SummaryCardProps {
  title: string
  value: string
  sub?: string
  positive?: boolean | null
  icon: React.ReactNode
  /** When true, value is hidden until user clicks the eye toggle (default hidden). */
  maskable?: boolean
  valueVisible?: boolean
  onToggleValueVisible?: () => void
}

function SummaryCard({
  title,
  value,
  sub,
  positive,
  icon,
  maskable = false,
  valueVisible = true,
  onToggleValueVisible,
}: SummaryCardProps) {
  const subColor =
    positive == null
      ? "text-[oklch(0.708_0_0)]"
      : positive
      ? "text-[#22d3ee]"
      : "text-[#f87171]"

  const showMasked = maskable && !valueVisible && value !== "—"
  const displayValue = showMasked ? MASKED_CURRENCY : value

  const showEye =
    maskable && value !== "—" && onToggleValueVisible

  return (
    <Card className="bg-[oklch(0.205_0_0)] border-[oklch(0.269_0_0)]">
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-5">
        <CardTitle className="text-xs font-medium text-[oklch(0.708_0_0)] uppercase tracking-wide">
          {title}
        </CardTitle>
        <span className="text-[oklch(0.556_0_0)]">{icon}</span>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <p
            className={`text-xl font-semibold text-[oklch(0.985_0_0)] ${showMasked ? "tracking-wide select-none" : ""}`}
          >
            {displayValue}
          </p>
          {showEye && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 -translate-y-px text-[oklch(0.556_0_0)] hover:bg-[oklch(0.269_0_0)] hover:text-[oklch(0.985_0_0)]"
              onClick={onToggleValueVisible}
              aria-label={valueVisible ? "Hide amount" : "Show amount"}
              aria-pressed={valueVisible}
            >
              {valueVisible ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </Button>
          )}
        </div>
        {sub && !showMasked && (
          <p className={`text-sm mt-0.5 font-medium ${subColor}`}>{sub}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ── Loading skeleton ───────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-[oklch(0.205_0_0)] border-[oklch(0.269_0_0)]">
            <CardHeader className="pb-1 pt-4 px-5">
              <Skeleton className="h-3 w-20 bg-[oklch(0.269_0_0)]" />
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <Skeleton className="h-6 w-28 bg-[oklch(0.269_0_0)]" />
              <Skeleton className="h-4 w-16 mt-1 bg-[oklch(0.269_0_0)]" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Grid skeleton */}
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full bg-[oklch(0.205_0_0)]" />
        ))}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function PortfolioPageClient() {
  const [brokers, setBrokers] = useState<PortfolioUpdates[]>([])
  const [selectedUserBrokerId, setSelectedUserBrokerId] = useState<string>("")
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null)
  const [metaLoading, setMetaLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [portfolioValueVisible, setPortfolioValueVisible] = useState(false)
  const [investedVisible, setInvestedVisible] = useState(false)
  const [pnlVisible, setPnlVisible] = useState(false)

  const columnDefs = useMemo(() => buildColumnDefs(), [])

  // Fetch broker list on mount
  useEffect(() => {
    const loadMeta = async () => {
      setMetaLoading(true)
      setError(null)
      try {
        const meta = await getHoldingsMetadata()
        setBrokers(meta.portfolio_updates)
        if (meta.portfolio_updates.length > 0) {
          setSelectedUserBrokerId(meta.portfolio_updates[0].broker_user_id)
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load broker list")
      } finally {
        setMetaLoading(false)
      }
    }
    loadMeta()
  }, [])

  // Fetch portfolio data when selected broker changes
  useEffect(() => {
    if (!selectedUserBrokerId) return
    const loadPortfolio = async () => {
      setDataLoading(true)
      setError(null)
      try {
        const data = await getPortfolio(selectedUserBrokerId)
        setPortfolio(data)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load portfolio")
        setPortfolio(null)
      } finally {
        setDataLoading(false)
      }
    }
    loadPortfolio()
  }, [selectedUserBrokerId])

  const handleRefresh = async () => {
    if (!selectedUserBrokerId) return
    setDataLoading(true)
    setError(null)
    try {
      const data = await getPortfolio(selectedUserBrokerId)
      setPortfolio(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load portfolio")
    } finally {
      setDataLoading(false)
    }
  }

  // ── Render states ──────────────────────────────────────────────────────

  if (metaLoading) {
    return (
      <div className="p-6 max-w-[1920px] w-full mx-auto">
        <LoadingSkeleton />
      </div>
    )
  }

  if (brokers.length === 0) {
    return (
      <div className="p-6 max-w-[1920px] w-full mx-auto flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Wallet className="h-12 w-12 text-[oklch(0.556_0_0)]" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[oklch(0.985_0_0)]">No portfolio data yet</h2>
          <p className="text-sm text-[oklch(0.708_0_0)] mt-1">
            Upload your holdings from the{" "}
            <a href="/integrations" className="text-[#22d3ee] hover:underline">
              Integrations
            </a>{" "}
            page to get started.
          </p>
        </div>
      </div>
    )
  }

  const summary = portfolio?.summary
  const pnlPositive = summary ? summary.total_pnl_absolute >= 0 : null

  return (
    <div className="p-6 max-w-[1920px] w-full mx-auto flex flex-col gap-5">
      {/* ── Header row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[oklch(0.985_0_0)]">Portfolio</h1>
          {portfolio?.last_updated_at && (
            <p className="text-xs text-[oklch(0.556_0_0)] mt-0.5">
              Last updated:{" "}
              {new Date(portfolio.last_updated_at).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Broker selector — only shown when user has multiple broker portfolios */}
          {brokers.length > 1 && (
            <Select value={selectedUserBrokerId} onValueChange={setSelectedUserBrokerId}>
              <SelectTrigger className="w-44 bg-[oklch(0.205_0_0)] border-[oklch(0.269_0_0)] text-[oklch(0.985_0_0)] focus:ring-[#22d3ee]/40">
                <SelectValue placeholder="Select broker" />
              </SelectTrigger>
              <SelectContent className="bg-[oklch(0.205_0_0)] border-[oklch(0.269_0_0)] text-[oklch(0.985_0_0)]">
                {brokers.map((b) => (
                  <SelectItem
                    key={b.broker_user_id}
                    value={b.broker_user_id}
                    className="focus:bg-[oklch(0.269_0_0)] focus:text-[oklch(0.985_0_0)]"
                  >
                    {b.broker_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={dataLoading}
            className="gap-2 border-[oklch(0.269_0_0)] text-[oklch(0.985_0_0)] hover:bg-[oklch(0.269_0_0)] bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 ${dataLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-[#f87171]/30 bg-[#f87171]/10 px-4 py-3 text-sm text-[#f87171]">
          <span className="font-medium">Error:</span> {error}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="ml-auto text-[#f87171] hover:text-[#f87171] hover:bg-[#f87171]/10 h-7 px-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* ── Summary cards ── */}
      {dataLoading && !portfolio ? (
        <LoadingSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              title="Portfolio Value"
              value={summary ? fmtCurrency(summary.total_current_value) : "—"}
              icon={<Wallet className="h-4 w-4" />}
              maskable
              valueVisible={portfolioValueVisible}
              onToggleValueVisible={() => setPortfolioValueVisible((v) => !v)}
            />
            <SummaryCard
              title="Invested"
              value={summary ? fmtCurrency(summary.total_investment_value) : "—"}
              icon={<Wallet className="h-4 w-4" />}
              maskable
              valueVisible={investedVisible}
              onToggleValueVisible={() => setInvestedVisible((v) => !v)}
            />
            <SummaryCard
              title="Overall P&L"
              value={summary ? `${summary.total_pnl_absolute >= 0 ? "+" : ""}${fmtCurrency(summary.total_pnl_absolute)}` : "—"}
              sub={summary ? fmtPercent(summary.total_pnl_percent) : undefined}
              positive={pnlPositive}
              icon={
                pnlPositive
                  ? <TrendingUp className="h-4 w-4 text-[#22d3ee]" />
                  : <TrendingDown className="h-4 w-4 text-[#f87171]" />
              }
              maskable
              valueVisible={pnlVisible}
              onToggleValueVisible={() => setPnlVisible((v) => !v)}
            />
            <SummaryCard
              title="Holdings"
              value={portfolio ? String(portfolio.holdings.length) : "—"}
              sub={portfolio ? `via ${portfolio.broker_name}` : undefined}
              icon={<Wallet className="h-4 w-4" />}
            />
          </div>

          {/* ── Holdings grid ── */}
          {portfolio && portfolio.holdings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-[oklch(0.269_0_0)] bg-[oklch(0.205_0_0)] py-16 gap-3">
              <Wallet className="h-10 w-10 text-[oklch(0.556_0_0)]" />
              <p className="text-sm text-[oklch(0.708_0_0)]">No holdings found for this broker.</p>
            </div>
          ) : (
            <div
              className="rounded-xl overflow-hidden border border-[oklch(0.269_0_0)] bg-[oklch(0.145_0_0)]"
              style={{ height: "calc(100vh - 340px)", minHeight: 420 }}
            >
              <AgGridReact<PortfolioHoldingItem>
                theme={portfolioGridTheme}
                rowData={portfolio?.holdings ?? []}
                columnDefs={columnDefs}
                defaultColDef={{
                  sortable: true,
                  filter: true,
                  resizable: true,
                  suppressHeaderMenuButton: true,
                  cellClass: "font-medium",
                }}
                animateRows
                suppressMovableColumns
                rowHeight={64}
                headerHeight={44}
                pagination
                paginationPageSize={25}
                paginationPageSizeSelector={[10, 25, 50, 100]}
                domLayout="normal"
                autoSizeStrategy={{ type: "fitGridWidth" }}
                loadingOverlayComponent={() => (
                  <div className="text-[oklch(0.708_0_0)] text-sm">Loading holdings…</div>
                )}
                loading={dataLoading}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
