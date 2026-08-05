"use client"

import { Check, TrendingDown, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  formatPrice,
  formatSignedPercentage,
  formatWindow,
  type TriggeredAlert,
} from "@/features/demo-us-stocks/apis/demo-us-stocks-api"

interface DemoUsStockAlertListProps {
  alerts: TriggeredAlert[]
  pendingAlertId: string | null
  onMarkRead: (alert: TriggeredAlert) => void
}

const formatTriggeredAt = (value: string): string => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}

const windowSecondsOf = (alert: TriggeredAlert): number =>
  Math.round(
    (new Date(alert.window_end).getTime() - new Date(alert.window_start).getTime()) / 1000,
  )

export function DemoUsStockAlertList({
  alerts,
  pendingAlertId,
  onMarkRead,
}: DemoUsStockAlertListProps) {
  if (alerts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No alerts yet. Matching price moves will show up here.
      </p>
    )
  }

  return (
    <ul className="space-y-2" role="list">
      {alerts.map((alert) => {
        const change = Number(alert.percentage_change)
        const isUp = change >= 0
        const TrendIcon = isUp ? TrendingUp : TrendingDown
        const isPending = pendingAlertId === alert.id

        return (
          <li
            key={alert.id}
            className={cn(
              "rounded-lg border p-3",
              alert.is_read
                ? "border-white/[0.06] bg-transparent"
                : "border-[#22d3ee]/30 bg-[#22d3ee]/[0.04]",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <TrendIcon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isUp ? "text-emerald-400" : "text-red-400",
                    )}
                    aria-hidden
                  />
                  <span className="font-mono text-sm font-semibold text-white">
                    {alert.symbol}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isUp ? "text-emerald-400" : "text-red-400",
                    )}
                  >
                    {formatSignedPercentage(alert.percentage_change)}%
                  </span>
                  <Badge variant="secondary">{formatWindow(windowSecondsOf(alert))}</Badge>
                  {!alert.is_read && <Badge>New</Badge>}
                </div>

                <p className="mt-1.5 whitespace-pre-line text-sm text-gray-300">
                  {alert.message}
                </p>

                <p className="mt-1.5 text-xs text-muted-foreground">
                  {formatPrice(alert.opening_price)} &rarr; {formatPrice(alert.closing_price)}
                  {" · "}
                  {formatTriggeredAt(alert.triggered_at)}
                </p>
              </div>

              {!alert.is_read && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMarkRead(alert)}
                  disabled={isPending}
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Mark read
                </Button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
