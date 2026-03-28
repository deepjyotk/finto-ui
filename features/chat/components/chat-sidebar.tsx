"use client"

import type React from "react"
import { useSelector, useDispatch } from "react-redux"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState, useRef, useCallback } from "react"
import type { AppDispatch, RootState } from "@/lib/store"
import {
  loadChatSessions,
  deleteChatSession,
  selectChatSessions,
  selectIsChatSessionsLoading,
  formatSessionDate,
  setChatSidebarOpen,
  startNewChat,
} from "@/features/chat/redux"
import { selectChatSidebarOpen } from "@/features/chat/redux/chat.selectors"
import { Button } from "@/components/ui/button"
import {
  Plus,
  MessageSquare,
  X,
  MoreHorizontal,
  Trash2,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ChatSidebar() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const pathname = usePathname()
  const sidebarOpen = useSelector(selectChatSidebarOpen)
  const sessions = useSelector(selectChatSessions)
  const loading = useSelector(selectIsChatSessionsLoading)

  const [search, setSearch] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (pathname?.startsWith("/chat")) {
      dispatch(loadChatSessions())
    }
  }, [pathname, dispatch])

  useEffect(() => {
    if (sidebarOpen) {
      requestAnimationFrame(() => searchRef.current?.focus())
    } else {
      setSearch("")
    }
  }, [sidebarOpen])

  const close = useCallback(() => {
    dispatch(setChatSidebarOpen(false))
  }, [dispatch])

  const handleNewChat = () => {
    dispatch(startNewChat({ router }))
  }

  const handleDeleteSession = async (
    sessionId: string,
    e: React.MouseEvent
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const activeSessionId = pathname?.startsWith("/chat/")
      ? pathname.split("/")[2] ?? null
      : null
    await dispatch(deleteChatSession({ sessionId, activeSessionId, router }))
  }

  const filteredSessions = search.trim()
    ? sessions.filter((s) => {
        const q = search.toLowerCase()
        return (
          s.session_id.toLowerCase().includes(q) ||
          formatSessionDate(s.started_at).toLowerCase().includes(q)
        )
      })
    : sessions

  const activeSessionId = pathname?.startsWith("/chat/")
    ? pathname.split("/")[2] ?? null
    : null

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-200",
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={close}
        aria-hidden
      />

      {/* Sidebar panel */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-[300px] bg-[#18191b] text-white",
          "flex flex-col border-r border-white/[0.06]",
          "shadow-2xl shadow-black/40",
          "transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
          <span className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider pl-1">
            Agents
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            className="h-7 w-7 text-gray-500 hover:text-white hover:bg-white/10"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Agents..."
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] py-2 pl-8 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-white/15 focus:outline-none focus:ring-0 transition-colors"
            />
          </div>
        </div>

        {/* New Agent */}
        <div className="px-3 pb-2 shrink-0">
          <Button
            onClick={handleNewChat}
            variant="ghost"
            className="w-full justify-start gap-2 border border-white/10 text-white hover:bg-white/[0.06] h-9 text-sm"
          >
            <Plus className="h-4 w-4" />
            New Agent
          </Button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {loading ? (
            <div className="flex flex-col gap-2 px-1 pt-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-[52px] animate-pulse rounded-lg bg-white/[0.04]"
                />
              ))}
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="space-y-0.5 pt-1">
              {filteredSessions.map((session) => {
                const isActive = activeSessionId === session.session_id
                const sessionDate = formatSessionDate(session.started_at)

                return (
                  <div
                    key={session.session_id}
                    className={cn(
                      "group flex items-center rounded-lg transition-colors hover:bg-white/[0.06]",
                      isActive && "bg-white/[0.08]"
                    )}
                  >
                    <Link
                      href={`/chat/${session.session_id}`}
                      prefetch={false}
                      className="flex items-center gap-3 flex-1 min-w-0 px-3 py-2.5"
                      onClick={close}
                    >
                      <MessageSquare className="h-4 w-4 text-gray-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-gray-200">
                          Chat Session
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-gray-500">
                            {sessionDate}
                          </span>
                          <span className="text-[11px] text-gray-600 font-mono truncate">
                            {session.session_id.substring(0, 8)}
                          </span>
                        </div>
                      </div>
                    </Link>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="h-7 w-7 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mr-1.5 rounded-md cursor-pointer">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-44 bg-[#202123] border-white/10"
                      >
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={(e) =>
                            handleDeleteSession(session.session_id, e)
                          }
                          className="text-red-400 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
            </div>
          ) : search.trim() ? (
            <div className="py-10 text-center text-sm text-gray-500">
              No agents match &ldquo;{search}&rdquo;
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-gray-500">
              No agents yet
            </div>
          )}
        </div>
      </div>
    </>
  )
}
