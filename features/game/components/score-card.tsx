"use client"

import { TrendingUp, TrendingDown, Minus, Award, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MyResult } from "../apis/game-api"

interface ScoreCardProps {
  result: MyResult
}

const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`
const cleanSymbol = (s: string) => s.replace(/\.NS$/i, "")

export default function ScoreCard({ result }: ScoreCardProps) {
  const {
    excess_return_pct,
    portfolio_return_pct,
    nifty_return_pct,
    rank,
    total_participants,
    stocks,
    is_settled,
    contest_date,
  } = result

  const formatted = new Date(contest_date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  })

  const excessPositive = excess_return_pct > 0
  const excessNeutral = excess_return_pct === 0

  const rankLabel =
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      {/* Contest date */}
      <p className="text-center text-xs text-gray-500">{formatted}</p>

      {/* Hero — excess return */}
      <div
        className={cn(
          "flex flex-col items-center gap-2 rounded-2xl border p-6",
          excessNeutral
            ? "border-gray-600/40 bg-gray-900/40"
            : excessPositive
            ? "border-emerald-500/30 bg-emerald-500/[0.07]"
            : "border-red-500/30 bg-red-500/[0.07]",
        )}
      >
        {excessNeutral ? (
          <Minus className="h-8 w-8 text-gray-400" />
        ) : excessPositive ? (
          <TrendingUp className="h-8 w-8 text-emerald-400" />
        ) : (
          <TrendingDown className="h-8 w-8 text-red-400" />
        )}

        <span
          className={cn(
            "text-4xl font-extrabold tabular-nums",
            excessNeutral ? "text-gray-300" : excessPositive ? "text-emerald-400" : "text-red-400",
          )}
        >
          {fmtPct(excess_return_pct)}
        </span>

        <p className="text-sm text-gray-400">
          {excessNeutral
            ? "You matched Nifty exactly"
            : excessPositive
            ? `You beat Nifty by ${fmtPct(excess_return_pct)}`
            : `Nifty beat you by ${fmtPct(Math.abs(excess_return_pct))}`}
        </p>
      </div>

      {/* Rank badge */}
      {is_settled && (
        <div className="flex items-center justify-center gap-2">
          <Award className="h-4 w-4 text-[#22d3ee]" />
          <span className="text-sm font-semibold text-white">
            Rank {rankLabel} of {total_participants}
          </span>
        </div>
      )}

      {!is_settled && (
        <div className="flex items-center justify-center gap-2 text-sm text-amber-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Waiting for results…
        </div>
      )}

      {/* Per-stock breakdown */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
          Stock Breakdown
        </p>
        <div className="space-y-1.5">
          {stocks.map(({ symbol, return_pct }) => {
            const pos = return_pct >= 0
            return (
              <div
                key={symbol}
                className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#1a1f2e] px-3 py-2"
              >
                <span className="text-sm font-medium text-white">{cleanSymbol(symbol)}</span>
                {is_settled ? (
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      pos ? "text-emerald-400" : "text-red-400",
                    )}
                  >
                    {fmtPct(return_pct)} {pos ? "🟢" : "🔴"}
                  </span>
                ) : (
                  <span className="text-xs text-gray-600">Pending</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary row */}
        {is_settled && (
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-gray-400">
            <span>
              Portfolio:{" "}
              <span className={cn("font-semibold", portfolio_return_pct >= 0 ? "text-emerald-400" : "text-red-400")}>
                {fmtPct(portfolio_return_pct)}
              </span>
            </span>
            <span>
              Nifty:{" "}
              <span className={cn("font-semibold", nifty_return_pct >= 0 ? "text-emerald-400" : "text-red-400")}>
                {fmtPct(nifty_return_pct)}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
