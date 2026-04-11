"use client"

import type React from "react"
import { useSelector, useDispatch } from "react-redux"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState, useRef, useCallback } from "react"
import type { AppDispatch } from "@/lib/store"
import {
  loadChatSessions,
  deleteChatSession,
  selectChatSessions,
  selectIsChatSessionsLoading,
  groupChatSessionsForSidebar,
  getSessionDisplayTitle,
  setChatSidebarOpen,
  startNewChat,
} from "@/features/chat/redux"
import { selectChatSidebarOpen } from "@/features/chat/redux/chat.selectors"
import { useChatShell } from "@/features/chat/components/chat-shell-context"
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

export default function ChatSessionSidebar() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const pathname = usePathname()
  const sidebarOpen = useSelector(selectChatSidebarOpen)
  const sessions = useSelector(selectChatSessions)
  const loading = useSelector(selectIsChatSessionsLoading)
  const { registerSessionSearchFocus } = useChatShell()

  const [search, setSearch] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (pathname?.startsWith("/chat")) {
      dispatch(loadChatSessions())
    }
  }, [pathname, dispatch])

  useEffect(() => {
    registerSessionSearchFocus(() => {
      searchRef.current?.focus()
    })
    return () => {
      registerSessionSearchFocus(() => {})
    }
  }, [registerSessionSearchFocus])

  useEffect(() => {
    if (sidebarOpen) {
      requestAnimationFrame(() => {
        searchRef.current?.focus()
      })
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
        const preview = (s.preview ?? "").toLowerCase()
        const title = getSessionDisplayTitle(s).toLowerCase()
        return (
          s.session_id.toLowerCase().includes(q) ||
          preview.includes(q) ||
          title.includes(q)
        )
      })
    : sessions

  const sessionSections = groupChatSessionsForSidebar(filteredSessions)

  const activeSessionId = pathname?.startsWith("/chat/")
    ? pathname.split("/")[2] ?? null
    : null

  return (
    <div className="relative w-0 shrink-0 overflow-visible md:w-[300px] md:shrink-0">
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-200 md:hidden",
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={close}
        aria-hidden
      />

      <aside
        className={cn(
          "flex h-full w-[300px] flex-col border-r border-white/[0.06] bg-[#18191b] text-white shadow-2xl shadow-black/40",
          "fixed inset-y-0 left-0 z-50 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "md:relative md:inset-auto md:z-auto md:translate-x-0 md:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex shrink-0 items-center justify-between px-3 pb-2 pt-3">
          <span className="pl-1 text-[13px] font-semibold uppercase tracking-wider text-gray-400">
            Agents
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            className="h-7 w-7 text-gray-500 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="shrink-0 px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Agents..."
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] py-2 pl-8 pr-3 text-sm text-white placeholder:text-gray-500 transition-colors focus:border-white/15 focus:outline-none focus:ring-0"
            />
          </div>
        </div>

        <div className="shrink-0 px-3 pb-2">
          <Button
            onClick={handleNewChat}
            variant="ghost"
            className="h-9 w-full justify-start gap-2 border border-white/10 text-sm text-white hover:bg-white/[0.06]"
          >
            <Plus className="h-4 w-4" />
            New Agent
          </Button>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-2 pb-2"
          aria-label="Conversations"
        >
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
            <div className="space-y-3 pt-1">
              {sessionSections.map((section) => (
                <div key={`${section.tier}-${section.label}`}>
                  <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    {section.label}
                  </div>
                  <div className="space-y-0.5">
                    {section.sessions.map((session) => {
                      const isActive = activeSessionId === session.session_id

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
                            className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5"
                            onClick={close}
                          >
                            <MessageSquare
                              className={cn(
                                "h-4 w-4 shrink-0",
                                isActive ? "text-[#22d3ee]" : "text-gray-500"
                              )}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[13px] font-medium text-gray-200">
                                {getSessionDisplayTitle(session)}
                              </div>
                            </div>
                          </Link>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div className="mr-1.5 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-500 opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover:opacity-100">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-44 border-white/10 bg-[#202123]"
                            >
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={(e) =>
                                  handleDeleteSession(session.session_id, e)
                                }
                                className="cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
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
        </nav>
      </aside>
    </div>
  )
}
