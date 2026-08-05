"use client"

import { Pause, Play, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  formatDirection,
  formatPercentage,
  formatWindow,
  type AlertRule,
} from "@/features/demo-us-stocks/apis/demo-us-stocks-api"

interface DemoUsStockAlertRuleListProps {
  rules: AlertRule[]
  pendingRuleId: string | null
  onToggleActive: (rule: AlertRule) => void
  onDelete: (rule: AlertRule) => void
}

export function DemoUsStockAlertRuleList({
  rules,
  pendingRuleId,
  onToggleActive,
  onDelete,
}: DemoUsStockAlertRuleListProps) {
  if (rules.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No rules yet. Create one to start evaluating price movements.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-white/[0.06]" role="list">
      {rules.map((rule) => {
        const isPending = pendingRuleId === rule.id
        return (
          <li
            key={rule.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-white">{rule.symbol}</span>
                <Badge variant={rule.is_active ? "default" : "secondary"}>
                  {rule.is_active ? "Active" : "Paused"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Moves {formatDirection(rule.direction)} by at least{" "}
                {formatPercentage(rule.percentage_threshold)}% within{" "}
                {formatWindow(rule.window_seconds)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleActive(rule)}
                disabled={isPending}
              >
                {rule.is_active ? (
                  <>
                    <Pause className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Resume
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(rule)}
                disabled={isPending}
                aria-label={`Delete ${rule.symbol} rule`}
                className="text-gray-400 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
