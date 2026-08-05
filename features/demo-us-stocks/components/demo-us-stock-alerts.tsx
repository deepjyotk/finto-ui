"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertCircle, BellRing, Plus, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { DemoUsStockAlertForm } from "@/features/demo-us-stocks/components/demo-us-stock-alert-form"
import { DemoUsStockAlertList } from "@/features/demo-us-stocks/components/demo-us-stock-alert-list"
import { DemoUsStockAlertRuleList } from "@/features/demo-us-stocks/components/demo-us-stock-alert-rule-list"
import { DemoUsStockPriceChart } from "@/features/demo-us-stocks/components/demo-us-stock-price-chart"
import {
  deleteAlertRule,
  getAlertRules,
  getAlerts,
  getSupportedSymbols,
  markAlertRead,
  updateAlertRule,
  type AlertRule,
  type ChartWindow,
  type TriggeredAlert,
} from "@/features/demo-us-stocks/apis/demo-us-stocks-api"

export function DemoUsStockAlerts() {
  const { toast } = useToast()
  const [symbols, setSymbols] = useState<string[]>([])
  const [windowOptions, setWindowOptions] = useState<number[]>([])
  const [chartWindowOptions, setChartWindowOptions] = useState<ChartWindow[]>([])
  const [defaultSymbol, setDefaultSymbol] = useState<string | null>(null)
  const [defaultChartWindow, setDefaultChartWindow] = useState<ChartWindow | null>(null)
  const [rules, setRules] = useState<AlertRule[]>([])
  const [alerts, setAlerts] = useState<TriggeredAlert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [pendingRuleId, setPendingRuleId] = useState<string | null>(null)
  const [pendingAlertId, setPendingAlertId] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    const [symbolsData, rulesData, alertsData] = await Promise.all([
      getSupportedSymbols(),
      getAlertRules(),
      getAlerts(),
    ])
    setSymbols(symbolsData.symbols)
    setWindowOptions(symbolsData.window_seconds_options)
    setChartWindowOptions(symbolsData.chart_window_options)
    // The backend owns the defaults, but fall back to the first supported
    // symbol so the chart still renders if TSLA ever leaves the demo list.
    setDefaultSymbol(
      symbolsData.symbols.includes(symbolsData.default_symbol)
        ? symbolsData.default_symbol
        : (symbolsData.symbols[0] ?? null),
    )
    setDefaultChartWindow(symbolsData.default_chart_window)
    setRules(rulesData.rules)
    setAlerts(alertsData.alerts)
    setUnreadCount(alertsData.unread_count)
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        await loadAll()
        if (!cancelled) setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load the US stock demo")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [loadAll])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadAll()
      setError(null)
    } catch (err) {
      toast({
        title: "Refresh failed",
        description: err instanceof Error ? err.message : "Could not refresh alerts",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRuleCreated = (rule: AlertRule) => {
    setRules((current) => [rule, ...current])
    setShowForm(false)
    toast({
      title: "Alert rule created",
      description: `${rule.symbol} will be evaluated on every completed window.`,
    })
  }

  const handleToggleActive = async (rule: AlertRule) => {
    setPendingRuleId(rule.id)
    try {
      const updated = await updateAlertRule(rule.id, { is_active: !rule.is_active })
      setRules((current) => current.map((r) => (r.id === updated.id ? updated : r)))
      toast({
        title: updated.is_active ? "Rule resumed" : "Rule paused",
        description: `${updated.symbol} is now ${updated.is_active ? "active" : "paused"}.`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update the rule",
        variant: "destructive",
      })
    } finally {
      setPendingRuleId(null)
    }
  }

  const handleDeleteRule = async (rule: AlertRule) => {
    setPendingRuleId(rule.id)
    try {
      await deleteAlertRule(rule.id)
      setRules((current) => current.filter((r) => r.id !== rule.id))
      // Deleting a rule cascades to its alerts, so drop them from the list too.
      setAlerts((current) => current.filter((a) => a.rule_id !== rule.id))
      toast({
        title: "Rule deleted",
        description: `${rule.symbol} rule and its alerts were removed.`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete the rule",
        variant: "destructive",
      })
    } finally {
      setPendingRuleId(null)
    }
  }

  const handleMarkRead = async (alert: TriggeredAlert) => {
    setPendingAlertId(alert.id)
    try {
      const updated = await markAlertRead(alert.id)
      setAlerts((current) => current.map((a) => (a.id === updated.id ? updated : a)))
      setUnreadCount((current) => Math.max(current - 1, 0))
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to mark the alert as read",
        variant: "destructive",
      })
    } finally {
      setPendingAlertId(null)
    }
  }

  return (
    <section aria-labelledby="demo-us-stock-heading" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2
              id="demo-us-stock-heading"
              className="text-xl font-semibold tracking-tight text-white"
            >
              US Stock Data Engineering Demo
            </h2>
            {unreadCount > 0 && <Badge>{unreadCount} new</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Live US prices stream through Redpanda into Spark Structured Streaming, which stores
            them in TimescaleDB, windows them and evaluates your rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            <RefreshCw
              className={isRefreshing ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"}
              aria-hidden
            />
            Refresh
          </Button>
          <Button onClick={() => setShowForm(true)} disabled={isLoading || symbols.length === 0}>
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Create US Stock Alert
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[380px] w-full" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {defaultSymbol && defaultChartWindow && chartWindowOptions.length > 0 && (
            <DemoUsStockPriceChart
              symbols={symbols}
              defaultSymbol={defaultSymbol}
              defaultWindow={defaultChartWindow}
              windowOptions={chartWindowOptions}
            />
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your rules</CardTitle>
                <CardDescription>
                  A rule triggers when the window move in the chosen direction reaches its
                  threshold.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DemoUsStockAlertRuleList
                  rules={rules}
                  pendingRuleId={pendingRuleId}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDeleteRule}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-[#22d3ee]" aria-hidden />
                  <CardTitle className="text-base">Triggered alerts</CardTitle>
                </div>
                <CardDescription>
                  Written by the Spark job once a window closes. Refresh to pick up new ones.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DemoUsStockAlertList
                  alerts={alerts}
                  pendingAlertId={pendingAlertId}
                  onMarkRead={handleMarkRead}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <DemoUsStockAlertForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        symbols={symbols}
        windowOptions={windowOptions}
        onCreated={handleRuleCreated}
      />
    </section>
  )
}
