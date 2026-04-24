"use client"

import Link from "next/link"
import { Trophy, ArrowRight } from "lucide-react"

export default function DailyContestBanner() {
  return (
    <section className="px-6 py-4">
      <Link
        href="/game"
        className="group mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-5 py-4 transition-colors hover:border-amber-400/40 hover:bg-amber-400/10"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15">
            <Trophy className="h-4 w-4 text-amber-400" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Daily Stock Contest</p>
            <p className="text-xs text-gray-500">
              Pick 5 stocks, beat Nifty, climb the leaderboard — new contest every day
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-400 transition-transform group-hover:translate-x-0.5">
          Play now <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </Link>
    </section>
  )
}
