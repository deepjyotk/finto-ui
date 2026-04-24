"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useSelector } from "react-redux"
import { Loader2, CalendarDays, ChevronLeft, ChevronRight, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RootState } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import {
  getGameStatus,
  getMyResult,
  getLeaderboard,
  getAnonStatus,
} from "../apis/game-api"
import type { GameStatus, MyResult, LeaderboardResponse } from "../apis/game-api"

import StockPickerForm from "./stock-picker-form"
import PicksLockedCard from "./picks-locked-card"
import ScoreCard from "./score-card"
import Leaderboard from "./leaderboard"
import LivePerformance from "./live-performance"
import MyPicksHistory from "./my-picks-history"
import { useAnonGame } from "../hooks/use-anon-game"

// ── helpers ────────────────────────────────────────────────────────────────

function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date())
}

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + "T00:00:00")
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function fmtDisplayDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  })
}

function inferPhase(status?: GameStatus | null): "open" | "submitted" | "settled" {
  if (!status) return "open"
  if (status.phase) return status.phase
  if (status.is_settled) return "settled"
  if (status.has_submitted) return "submitted"
  return "open"
}

// ── component ──────────────────────────────────────────────────────────────

export default function GamePageClient() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const [contestDate, setContestDate] = useState(todayIST())
  const isToday = contestDate === todayIST()

  // Data
  const [status, setStatus] = useState<GameStatus | null>(null)
  const [myResult, setMyResult] = useState<MyResult | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // After submission, store locked stocks temporarily
  const [lockedStocks, setLockedStocks] = useState<string[]>([])

  // Anonymous game state
  const { anonId, displayName, setDisplayName } = useAnonGame()
  const [anonStatus, setAnonStatus] = useState<GameStatus | null>(null)
  const [anonLockedStocks, setAnonLockedStocks] = useState<string[]>([])

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const fetchAll = useCallback(async (date: string) => {
    setError(null)
    try {
      const [statusData, leaderboardData] = await Promise.all([
        isAuthenticated ? getGameStatus(date) : null,
        getLeaderboard(date),
      ])

      if (statusData) setStatus(statusData)
      if (leaderboardData) setLeaderboard(leaderboardData)

      // Fetch today's result when status phase is settled.
      // If user didn't participate, backend may return 404; that's not a hard error.
      if (statusData && inferPhase(statusData) === "settled" && isAuthenticated) {
        try {
          const result = await getMyResult(statusData.contest_date)
          setMyResult(result)
        } catch {
          setMyResult(null)
        }
      } else {
        setMyResult(null)
      }

      // Return whether we should keep polling
      return statusData ? inferPhase(statusData) !== "settled" : false
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load game data")
      return false
    }
  }, [isAuthenticated])

  // Initial load + date changes
  useEffect(() => {
    stopPolling()
    setLoading(true)
    setStatus(null)
    setMyResult(null)
    setLeaderboard(null)
    setLockedStocks([])
    setAnonStatus(null)
    setAnonLockedStocks([])

    fetchAll(contestDate).then((shouldPoll) => {
      setLoading(false)
      if (shouldPoll && isToday) {
        pollRef.current = setInterval(() => {
          fetchAll(contestDate).then((keepPolling) => {
            if (!keepPolling) stopPolling()
          })
        }, 60_000)
      }
    })

    // Fetch anon status separately (anonId loads async from localStorage)
    if (anonId) {
      getAnonStatus(anonId, isToday ? undefined : contestDate)
        .then(s => setAnonStatus(s))
        .catch(() => setAnonStatus(null))
    }

    return () => stopPolling()
  }, [contestDate, fetchAll, isToday, stopPolling, anonId])

  // ── Submission success ────────────────────────────────────────────────────
  const handlePicksSubmitted = (stocks: string[]) => {
    setLockedStocks(stocks)
    setStatus(prev =>
      prev ? { ...prev, has_submitted: true, is_settled: false, phase: "submitted" } : prev
    )
  }

  // ── Derive UI state ───────────────────────────────────────────────────────
  const authPhase = inferPhase(status)
  const canPick = isAuthenticated && authPhase === "open"
  const picksLocked = isAuthenticated && authPhase === "submitted"
  const resultsReady = isAuthenticated && authPhase === "settled"

  // Anon derived states (only meaningful when not authenticated)
  const anonPhase = inferPhase(anonStatus)
  const anonCanPick = !isAuthenticated && anonPhase === "open"
  const anonPicksLocked = !isAuthenticated && anonPhase === "submitted"
  const anonResultsReady = !isAuthenticated && anonPhase === "settled"
  // True when logged in (e.g. via Google) but picks were only submitted anonymously before login
  const hasAnonPicksWhileAuthenticated =
    isAuthenticated && anonPhase === "submitted" && authPhase !== "submitted" && authPhase !== "settled"
  const anonDisplayStocks =
    anonLockedStocks.length > 0 ? anonLockedStocks : []

  // When picks were just submitted we already know the stocks
  const displayLockedStocks =
    lockedStocks.length > 0
      ? lockedStocks
      : myResult?.stocks.map(s => s.symbol) ?? []

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-[#0B0F14] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#22d3ee]/10">
            <Trophy className="h-5 w-5 text-[#22d3ee]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Daily Stock Game</h1>
            <p className="text-xs text-gray-500">
              Pick 5 stocks &amp; beat the Nifty 50
            </p>
          </div>
        </div>

        {/* Date navigation */}
        <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#111318] px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-white"
            onClick={() => setContestDate(prev => addDays(prev, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 text-sm text-gray-300">
            <CalendarDays className="h-4 w-4 text-gray-500" />
            <span className="font-medium">
              {isToday ? "Today — " : ""}{fmtDisplayDate(contestDate)}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-white disabled:opacity-30"
            onClick={() => setContestDate(prev => addDays(prev, 1))}
            disabled={isToday}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#22d3ee]" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <Tabs defaultValue="game" className="space-y-4">
            {/* Only show tabs when there's something to show in both panes */}
            {(resultsReady || picksLocked || leaderboard) && (
              <TabsList className="w-full rounded-xl border border-white/[0.07] bg-[#111318] p-1">
                <TabsTrigger
                  value="game"
                  className="flex-1 rounded-lg text-xs data-[state=active]:bg-[#22d3ee]/10 data-[state=active]:text-[#22d3ee]"
                >
                  {resultsReady ? "My Result" : "My Picks"}
                </TabsTrigger>
                <TabsTrigger
                  value="leaderboard"
                  className="flex-1 rounded-lg text-xs data-[state=active]:bg-[#22d3ee]/10 data-[state=active]:text-[#22d3ee]"
                >
                  Leaderboard
                </TabsTrigger>
                {isAuthenticated && (
                  <TabsTrigger
                    value="history"
                    className="flex-1 rounded-lg text-xs data-[state=active]:bg-[#22d3ee]/10 data-[state=active]:text-[#22d3ee]"
                  >
                    History
                  </TabsTrigger>
                )}
              </TabsList>
            )}

            <TabsContent value="game" className="mt-0">
              {/* CAN PICK */}
              {canPick && <StockPickerForm onSuccess={handlePicksSubmitted} />}

              {/* Authenticated but submitted picks only as anonymous (e.g. logged in via Google after playing as guest) */}
              {hasAnonPicksWhileAuthenticated && isToday && anonId && (
                <div className="mt-4">
                  <LivePerformance anonId={anonId} />
                </div>
              )}

              {/* NOT LOGGED IN — anon game flow */}
              {!isAuthenticated && (
                <>
                  {/* Anon: can pick */}
                  {anonCanPick && anonId && (
                    <StockPickerForm
                      onSuccess={(stocks) => {
                        setAnonLockedStocks(stocks)
                        setAnonStatus(prev =>
                          prev
                            ? { ...prev, has_submitted: true, is_settled: false, phase: "submitted" }
                            : { contest_date: contestDate, has_submitted: true, is_settled: false, phase: "submitted", total_participants: 0 }
                        )
                      }}
                      anonConfig={{
                        anonId,
                        displayName,
                        onDisplayNameChange: setDisplayName,
                      }}
                    />
                  )}

                  {/* Anon: picks locked + live */}
                  {anonPicksLocked && (
                    <>
                      <PicksLockedCard
                        stocks={anonDisplayStocks}
                        contestDate={anonStatus?.contest_date ?? contestDate}
                        totalParticipants={anonStatus?.total_participants ?? 0}
                      />
                      {isToday && anonId && (
                        <div className="mt-4">
                          <LivePerformance anonId={anonId} />
                        </div>
                      )}
                    </>
                  )}

                  {/* Anon: settled + enter next contest */}
                  {anonResultsReady && (
                    <div className="space-y-4 rounded-2xl border border-white/[0.07] bg-[#111318] p-4 text-center">
                      <p className="text-sm text-gray-300">Today's contest is settled.</p>
                      {anonStatus?.active_contest_date && (
                        <Button
                          type="button"
                          onClick={() => setContestDate(anonStatus.active_contest_date!)}
                          className="w-full bg-[#22d3ee] text-black hover:bg-[#06b6d4]"
                        >
                          🎯 Enter tomorrow&apos;s contest ({fmtDisplayDate(anonStatus.active_contest_date)})
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Anon: still loading anonId from localStorage */}
                  {!anonId && (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin text-[#22d3ee]" />
                    </div>
                  )}
                </>
              )}

              {/* PICKS LOCKED — waiting */}
              {picksLocked && (
                <PicksLockedCard
                  stocks={displayLockedStocks}
                  contestDate={status?.contest_date ?? contestDate}
                  totalParticipants={status?.total_participants ?? 0}
                />
              )}

              {/* RESULTS READY */}
              {resultsReady && (
                <>
                  {myResult ? (
                    <ScoreCard result={myResult} />
                  ) : (
                    <div className="rounded-2xl border border-white/[0.07] bg-[#111318] px-6 py-8 text-center text-sm text-gray-400">
                      No picks found for today.
                    </div>
                  )}

                  {status?.active_contest_date && (
                    <div className="mt-4 rounded-2xl border border-[#22d3ee]/20 bg-[#22d3ee]/5 p-4 text-center">
                      <p className="mb-3 text-sm text-gray-300">Today's contest is settled.</p>
                      <Button
                        type="button"
                        onClick={() => setContestDate(status.active_contest_date!)}
                        className="w-full bg-[#22d3ee] text-black hover:bg-[#06b6d4]"
                      >
                        🎯 Enter tomorrow&apos;s contest ({fmtDisplayDate(status.active_contest_date)})
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* LIVE PERFORMANCE — shown while phase is submitted */}
              {picksLocked && isToday && (
                <div className="mt-4">
                  <LivePerformance />
                </div>
              )}

              {/* Historical — not logged in or no picks */}
              {!isToday && !isAuthenticated && (
                <div className="rounded-2xl border border-white/[0.07] bg-[#111318] px-6 py-8 text-center text-sm text-gray-500">
                  Sign in to view your historical picks.
                </div>
              )}
              {!isToday && isAuthenticated && !status?.has_submitted && (
                <div className="rounded-2xl border border-white/[0.07] bg-[#111318] px-6 py-8 text-center text-sm text-gray-500">
                  You did not participate on {fmtDisplayDate(contestDate)}.
                </div>
              )}
            </TabsContent>

            <TabsContent value="leaderboard" className="mt-0">
              {leaderboard ? (
                <Leaderboard data={leaderboard} currentUserId={user?.user_id} />
              ) : (
                <div className="py-10 text-center text-sm text-gray-600">
                  No leaderboard data yet.
                </div>
              )}
            </TabsContent>

            {isAuthenticated && (
              <TabsContent value="history" className="mt-0">
                <MyPicksHistory
                  onPlayToday={
                    status?.active_contest_date
                      ? () => setContestDate(status.active_contest_date!)
                      : undefined
                  }
                />
              </TabsContent>
            )}

            {/* If there are no tabs (plain leaderboard for spectators) show inline */}
            {!resultsReady && !picksLocked && !canPick && leaderboard && isToday && !isAuthenticated && (
              <div>
                {leaderboard && (
                  <Leaderboard data={leaderboard} currentUserId={user?.user_id} />
                )}
              </div>
            )}
          </Tabs>
        )}
      </div>
    </div>
  )
}
