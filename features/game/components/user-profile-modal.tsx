"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { getUserProfile } from "../apis/game-api"
import type { UserProfile } from "../apis/game-api"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtPct = (n: number | null | undefined) => {
  if (n == null) return "—"
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`
}

const cleanSymbol = (s: string) => s.replace(/\.NS$/i, "")

function fmtDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface UserProfileModalProps {
  userId: string | null
  onClose: () => void
}

export default function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    setProfile(null)
    setError(null)
    setLoading(true)
    getUserProfile(userId)
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load profile"))
      .finally(() => setLoading(false))
  }, [userId])

  return (
    <Dialog open={!!userId} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-y-auto bg-[#0B0F14] border border-white/[0.09]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Trophy className="h-4 w-4 text-[#22d3ee]" />
            {profile ? (profile.full_name || profile.username) : "Player Profile"}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-[#22d3ee]" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {profile && !loading && (
          <div className="space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/[0.07]">
              <div className="flex flex-col items-center gap-0.5 bg-[#111318] px-3 py-4">
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Games</span>
                <span className="text-2xl font-extrabold text-white">{profile.total_games}</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 bg-[#111318] px-3 py-4">
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Beat Nifty</span>
                <span className="text-2xl font-extrabold text-emerald-400">{profile.wins}</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 bg-[#111318] px-3 py-4">
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Win Rate</span>
                <span className="text-2xl font-extrabold text-[#22d3ee]">
                  {profile.total_games > 0
                    ? `${Math.round((profile.wins / profile.total_games) * 100)}%`
                    : "—"}
                </span>
              </div>
            </div>

            {/* History */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Past Picks
              </h3>
              {profile.history.length === 0 ? (
                <div className="rounded-xl border border-white/[0.07] bg-[#111318] px-4 py-8 text-center text-sm text-gray-600">
                  No history yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {profile.history.map((entry) => {
                    const excessPos = (entry.excess_return_pct ?? 0) >= 0
                    const excessNeutral = entry.excess_return_pct === 0 || entry.excess_return_pct == null

                    return (
                      <div
                        key={entry.contest_date}
                        className="rounded-xl border border-white/[0.07] bg-[#111318] px-4 py-3"
                      >
                        {/* Date + rank row */}
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-300">
                            {fmtDate(entry.contest_date)}
                          </span>
                          {entry.is_settled && entry.rank != null ? (
                            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-gray-400">
                              #{entry.rank}
                              {entry.total_participants ? ` / ${entry.total_participants}` : ""}
                            </span>
                          ) : (
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                              Pending
                            </span>
                          )}
                        </div>

                        {/* Stocks */}
                        <div className="mb-2.5 flex flex-wrap gap-1">
                          {entry.stocks.map((s) => (
                            <span
                              key={s}
                              className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-gray-300"
                            >
                              {cleanSymbol(s)}
                            </span>
                          ))}
                        </div>

                        {/* Returns */}
                        {entry.is_settled && (
                          <div className="flex items-center gap-3 text-xs">
                            <span
                              className={cn(
                                "font-semibold tabular-nums",
                                (entry.portfolio_return_pct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400",
                              )}
                            >
                              {fmtPct(entry.portfolio_return_pct)}
                            </span>
                            <span className="text-gray-700">vs Nifty</span>
                            <span className="flex items-center gap-0.5 font-bold tabular-nums">
                              {excessNeutral ? (
                                <Minus className="h-3 w-3 text-gray-400" />
                              ) : excessPos ? (
                                <TrendingUp className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-400" />
                              )}
                              <span className={excessNeutral ? "text-gray-400" : excessPos ? "text-emerald-400" : "text-red-400"}>
                                {fmtPct(entry.excess_return_pct)}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
