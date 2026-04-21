"use client"

import { cn } from "@/lib/utils"
import type { LeaderboardResponse } from "../apis/game-api"

interface LeaderboardProps {
  data: LeaderboardResponse
  currentUserId?: string
}

const fmtPct = (n: number | null | undefined) => {
  if (n == null) return "—"
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`
}
const cleanSymbol = (s: string) => s.replace(/\.NS$/i, "")
const medalIcon = (rank: number) =>
  rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null

export default function Leaderboard({ data, currentUserId }: LeaderboardProps) {
  const { contest_date, nifty_return_pct, is_settled, total_participants, leaderboard } = data

  const formatted = new Date(contest_date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold text-white">
          Daily Leaderboard — {formatted}
        </h2>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{total_participants} players today</span>
          <span className="text-gray-700">•</span>
          <span>
            Nifty 50:{" "}
            <span
              className={cn(
                "font-semibold",
                nifty_return_pct == null
                  ? "text-gray-500"
                  : nifty_return_pct >= 0
                  ? "text-emerald-400"
                  : "text-red-400",
              )}
            >
              {fmtPct(nifty_return_pct)}
            </span>
          </span>
        </div>
      </div>

      {/* Nifty benchmark bar */}
      <div className="flex items-center gap-2 rounded-xl border border-[#22d3ee]/20 bg-[#22d3ee]/5 px-3 py-2 text-xs text-[#22d3ee]">
        <span className="font-semibold">Nifty 50 benchmark</span>
        <span className="text-gray-500">—</span>
        <span className="font-bold">{fmtPct(nifty_return_pct)} today</span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
        {/* Header row */}
        <div className="grid grid-cols-[32px_1fr_auto_auto] gap-x-3 border-b border-white/[0.07] bg-[#1a1f2e] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          <span>#</span>
          <span>Player</span>
          <span className="text-right">Portfolio</span>
          <span className="text-right">vs Nifty</span>
        </div>

        {leaderboard.length === 0 ? (
          <div className="bg-[#111318] px-4 py-8 text-center text-sm text-gray-600">
            No entries yet. Be the first!
          </div>
        ) : (
          leaderboard.map((entry) => {
            const isMe = currentUserId === entry.user_id
            const medal = medalIcon(entry.rank)
            const excessPos = (entry.excess_return_pct ?? 0) >= 0

            return (
              <div
                key={entry.user_id}
                className={cn(
                  "grid grid-cols-[32px_1fr_auto_auto] items-start gap-x-3 border-b border-white/[0.04] px-4 py-3 text-sm last:border-0",
                  isMe
                    ? "bg-[#22d3ee]/[0.06] ring-1 ring-inset ring-[#22d3ee]/20"
                    : "bg-[#111318] hover:bg-[#1a1f2e]",
                )}
              >
                {/* Rank */}
                <span className="pt-0.5 text-center text-sm font-bold text-gray-400">
                  {medal ?? entry.rank}
                </span>

                {/* Player + stocks */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("font-semibold truncate", isMe ? "text-[#22d3ee]" : "text-white")}>
                      {entry.username}
                    </span>
                    {isMe && (
                      <span className="shrink-0 rounded-full bg-[#22d3ee]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#22d3ee]">
                        You
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-gray-600">
                    {entry.stocks.map(cleanSymbol).join(", ")}
                  </div>
                </div>

                {/* Portfolio return */}
                {is_settled ? (
                  <span
                    className={cn(
                      "pt-0.5 text-right text-sm font-semibold tabular-nums",
                      entry.portfolio_return_pct == null
                        ? "text-gray-500"
                        : entry.portfolio_return_pct >= 0
                        ? "text-emerald-400"
                        : "text-red-400",
                    )}
                  >
                    {fmtPct(entry.portfolio_return_pct)}
                  </span>
                ) : (
                  <span className="pt-0.5 text-right text-xs text-gray-600">—</span>
                )}

                {/* vs Nifty */}
                {is_settled ? (
                  <span
                    className={cn(
                      "pt-0.5 text-right text-sm font-bold tabular-nums",
                      entry.excess_return_pct == null
                        ? "text-gray-500"
                        : excessPos
                        ? "text-emerald-400"
                        : "text-red-400",
                    )}
                  >
                    {fmtPct(entry.excess_return_pct)}
                  </span>
                ) : (
                  <span className="pt-0.5 text-right text-xs italic text-gray-600">Pending</span>
                )}
              </div>
            )
          })
        )}
      </div>

      {!is_settled && (
        <p className="text-center text-xs text-gray-600">
          Results pending — check back after market close (3:30 PM IST).
        </p>
      )}
    </div>
  )
}
