"use client"

import type React from "react"
import { useSelector, useDispatch } from "react-redux"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import type { AppDispatch, RootState } from "@/lib/store"
import {
  loadChatSessions,
  deleteChatSession,
  selectChatSessions,
  selectIsChatSessionsLoading,
  selectChatSidebarCollapsed,
  toggleChatSidebarCollapsed,
  groupChatSessionsForSidebar,
  getSessionDisplayTitle,
  startNewChat,
} from "@/features/chat/redux"
import { Button } from "@/components/ui/button"
import {
  Plus,
  MessageSquare,
  MoreHorizontal,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function OldPersistentSidebar() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const pathname = usePathname()
  const sessions = useSelector(selectChatSessions)
  const loading = useSelector(selectIsChatSessionsLoading)
  const collapsed = useSelector(selectChatSidebarCollapsed)
  const { user } = useSelector((state: RootState) => state.auth)

  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null)

  useEffect(() => {
    if (pathname?.startsWith("/chat")) {
      dispatch(loadChatSessions())
    }
  }, [pathname, dispatch])

  const handleNewChat = useCallback(() => {
    dispatch(startNewChat({ router }))
  }, [dispatch, router])

  const handleToggleCollapse = useCallback(() => {
    dispatch(toggleChatSidebarCollapsed())
  }, [dispatch])

  const handleDeleteSession = useCallback(
    async (sessionId: string, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const activeSessionId = pathname?.startsWith("/chat/")
        ? pathname.split("/")[2] ?? null
        : null
      await dispatch(deleteChatSession({ sessionId, activeSessionId, router }))
    },
    [dispatch, pathname, router]
  )

  const activeSessionId = pathname?.startsWith("/chat/")
    ? pathname.split("/")[2] ?? null
    : null

  const sessionSections = groupChatSessionsForSidebar(sessions)

  const getUserInitials = () => {
    if (!user?.full_name || user.full_name.trim() === "") return "U"
    const names = user.full_name.trim().split(" ").filter((n) => n.length > 0)
    if (names.length === 0) return "U"
    if (names.length === 1) return names[0][0].toUpperCase()
    return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  }

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-white/[0.06] bg-[#111318] overflow-hidden",
          "transition-[width] duration-200 ease-in-out",
          collapsed ? "w-[52px]" : "w-[260px]"
        )}
      >
        {/* Sidebar header */}
        <div
          className={cn(
            "flex items-center shrink-0 pt-3 pb-2",
            collapsed ? "justify-center px-0" : "justify-between px-4"
          )}
        >
          {/* {!collapsed && (
            <span className="text-base font-semibold text-white tracking-tight">
              Arthik
            </span>
          )} */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleCollapse}
                className="h-7 w-7 text-gray-500 hover:text-white hover:bg-white/10 shrink-0"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* New Chat button */}
        <div className={cn("pb-3 shrink-0", collapsed ? "px-1.5" : "px-3")}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleNewChat}
                  variant="ghost"
                  size="icon"
                  className="w-full h-9 text-white/70 hover:text-white hover:bg-white/[0.06] border border-white/10"
                  aria-label="New chat"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">New chat</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              onClick={handleNewChat}
              variant="ghost"
              className="w-full justify-start gap-2 border border-white/10 text-white/80 hover:text-white hover:bg-white/[0.06] h-9 text-sm"
            >
              <Plus className="h-4 w-4" />
              New chat
            </Button>
          )}
        </div>

        {/* Session list */}
        <div className={cn("flex-1 overflow-y-auto pb-2", collapsed ? "px-1.5" : "px-2")}>
          {loading ? (
            <div className="flex flex-col gap-1.5 pt-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "animate-pulse rounded-lg bg-white/[0.04]",
                    collapsed ? "h-8 w-8 mx-auto" : "h-[52px]"
                  )}
                />
              ))}
            </div>
          ) : sessions.length > 0 ? (
            <div className={cn("space-y-3 pt-1", collapsed ? "space-y-0.5" : "")}>
              {collapsed
                ? sessions.map((session) => {
                    const isActive = activeSessionId === session.session_id
                    return (
                      <Tooltip key={session.session_id}>
                        <TooltipTrigger asChild>
                          <Link
                            href={`/chat/${session.session_id}`}
                            prefetch={false}
                            className={cn(
                              "flex h-9 w-full items-center justify-center rounded-lg transition-colors",
                              isActive
                                ? "bg-white/[0.09] text-[#22d3ee]"
                                : "text-gray-500 hover:bg-white/[0.05] hover:text-gray-300"
                            )}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[240px]">
                          <p className="font-medium break-words">
                            {getSessionDisplayTitle(session)}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })
                : sessionSections.map((section) => (
                    <div key={`${section.tier}-${section.label}`}>
                      <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        {section.label}
                      </div>
                      <div className="space-y-0.5">
                        {section.sessions.map((session) => {
                          const isActive = activeSessionId === session.session_id
                          const isHovered = hoveredSessionId === session.session_id

                          return (
                            <div
                              key={session.session_id}
                              className={cn(
                                "group flex items-center rounded-lg transition-colors",
                                isActive ? "bg-white/[0.09]" : "hover:bg-white/[0.05]"
                              )}
                              onMouseEnter={() => setHoveredSessionId(session.session_id)}
                              onMouseLeave={() => setHoveredSessionId(null)}
                            >
                              <Link
                                href={`/chat/${session.session_id}`}
                                prefetch={false}
                                className="flex items-center gap-2.5 flex-1 min-w-0 px-2.5 py-2.5"
                              >
                                <MessageSquare
                                  className={cn(
                                    "h-3.5 w-3.5 shrink-0 transition-colors",
                                    isActive ? "text-[#22d3ee]" : "text-gray-500"
                                  )}
                                />
                                <div className="min-w-0 flex-1">
                                  <div
                                    className={cn(
                                      "truncate text-[13px] font-medium",
                                      isActive ? "text-white" : "text-gray-300"
                                    )}
                                  >
                                    {getSessionDisplayTitle(session)}
                                  </div>
                                </div>
                              </Link>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <div
                                    className={cn(
                                      "h-6 w-6 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 shrink-0 mr-1.5 rounded cursor-pointer transition-opacity",
                                      isHovered || isActive ? "opacity-100" : "opacity-0"
                                    )}
                                  >
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
                    </div>
                  ))}
            </div>
          ) : (
            !collapsed && (
              <div className="py-10 text-center text-sm text-gray-500">
                No sessions yet
              </div>
            )
          )}
        </div>

        {/* User info at the bottom */}
        {user && (
          <div
            className={cn(
              "shrink-0 border-t border-white/[0.06] py-3",
              collapsed ? "flex justify-center px-0" : "px-3"
            )}
          >
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-7 w-7 cursor-default">
                    <AvatarFallback className="bg-[#c96a2f] text-white text-xs font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {user.full_name || user.email || "User"}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-2.5">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="bg-[#c96a2f] text-white text-xs font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-[13px] font-medium text-gray-300">
                  {user.full_name || user.email || "User"}
                </span>
              </div>
            )}
          </div>
        )}
      </aside>
    </TooltipProvider>
  )
}
