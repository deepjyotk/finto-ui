"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import RunnerCharacter from "./runner-character"

interface PicksLockedCardProps {
  stocks: string[]
  contestDate: string
  totalParticipants: number
}

export default function PicksLockedCard({ stocks, contestDate, totalParticipants }: PicksLockedCardProps) {
  const cleanSymbol = (s: string) => s.replace(/\.NS$/i, "")

  const formatted = new Date(contestDate + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  })

  return (
    <div className="mx-auto w-full max-w-md space-y-6 text-center">
      {/* Runner animation */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-48 overflow-visible pb-1 pt-2">
          {/* Runner bouncing across the track */}
          <div className="runner-patrol flex justify-center">
            <style>{`
              @keyframes _patrol {
                0%   { transform: translateX(-60px); }
                45%  { transform: translateX(60px);  }
                50%  { transform: translateX(60px) scaleX(-1); }
                95%  { transform: translateX(-60px) scaleX(-1); }
                100% { transform: translateX(-60px); }
              }
              .runner-patrol > * { animation: _patrol 3s ease-in-out infinite; }
            `}</style>
            <RunnerCharacter size={44} color="#22d3ee" speed={1.4} />
          </div>
          {/* Ground track */}
          <div className="relative mt-1 h-0.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
            <div className="absolute inset-0 animate-[shimmer_2s_linear_infinite] bg-gradient-to-r from-transparent via-[#22d3ee]/20 to-transparent" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Picks Locked!</h2>
          <p className="mt-1 text-sm text-gray-400">
            Waiting for market close to calculate results…
          </p>
        </div>
      </div>

      {/* Date + participants */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
        <span>{formatted}</span>
        <span className="text-gray-700">•</span>
        <span className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin text-[#22d3ee]" />
          {totalParticipants} players today
        </span>
      </div>

      {/* Locked picks */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Your Picks</p>
        <div className="space-y-2">
          {stocks.map((stock, i) => (
            <div
              key={stock}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5",
                "border border-white/[0.06] bg-[#1a1f2e]",
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#22d3ee]/10 text-[11px] font-bold text-[#22d3ee]">
                {i + 1}
              </span>
              <span className="flex-1 text-left text-sm font-medium text-white">
                {cleanSymbol(stock)}
              </span>
              <span className="text-xs text-gray-600">—</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Results and leaderboard update after market close (3:30 PM IST). The page polls automatically every 60 seconds.
      </p>
    </div>
  )
}
