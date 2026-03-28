"use client"

import type React from "react"

import { useSelector, useDispatch } from "react-redux"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import type { AppDispatch, RootState } from "@/lib/store"
import {
  loadChatSessions,
  deleteChatSession,
  selectChatSessions,
  selectIsChatSessionsLoading,
  formatSessionDate,
  getUserInitials,
  performLogout,
  setChatSidebarOpen,
  toggleChatSidebarCollapsed,
  startNewChat,
} from "@/features/chat/redux"
import { selectChatSidebarOpen, selectChatSidebarCollapsed } from "@/features/chat/redux/chat.selectors"
import { Button } from "@/components/ui/button"
import {
  Plus,
  MessageSquare,
  X,
  MoreHorizontal,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Sparkles,
  Settings,
  HelpCircle,
  UserCog,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function ChatSidebar() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const pathname = usePathname()
  const sidebarOpen = useSelector(selectChatSidebarOpen)
  const sidebarCollapsed = useSelector(selectChatSidebarCollapsed)
  const { user } = useSelector((state: RootState) => state.auth)
  const sessions = useSelector(selectChatSessions)
  const loading = useSelector(selectIsChatSessionsLoading)
  const [userMenuExpanded, setUserMenuExpanded] = useState(false)

  useEffect(() => {
    if (pathname?.startsWith("/chat")) {
      dispatch(loadChatSessions())
    }
  }, [pathname, dispatch])

  const handleNewChat = () => {
    dispatch(startNewChat({ router }))
  }

  const handleLogout = async () => {
    await dispatch(performLogout())
  }

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const activeSessionId = pathname?.startsWith("/chat/")
      ? pathname.split("/")[2] ?? null
      : null
    await dispatch(deleteChatSession({ sessionId, activeSessionId, router }))
  }

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => dispatch(setChatSidebarOpen(false))}
        />
      )}

      {/* ChatSidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-[#202123] text-white transform transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-64 lg:w-20" : "w-64 lg:w-64",
          "lg:relative lg:z-auto lg:transform-none lg:transition-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Brand + collapse toggle */}
          <div className="flex items-center justify-between border-b border-white/10 p-3">
            <div className="flex items-center gap-2">
              {!sidebarCollapsed && <span className="text-sm font-semibold">Arthik</span>}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => dispatch(toggleChatSidebarCollapsed())}
                className="text-white hover:bg-white/10"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => dispatch(setChatSidebarOpen(false))}
                className="text-white hover:bg-white/10 lg:hidden"
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-3">
            <Button
              onClick={handleNewChat}
              variant="ghost"
              className={cn(
                "w-full border border-white/20 text-white hover:bg-white/10",
                sidebarCollapsed ? "justify-center px-2" : "justify-start",
              )}
            >
              <Plus className="h-4 w-4" />
              {!sidebarCollapsed && <span className="ml-2">New chat</span>}
            </Button>
          </div>

          {/* Chat History */}
          <div className={cn("mt-1 flex-1 overflow-y-auto px-2", sidebarCollapsed && "px-1")}>
            {!sidebarCollapsed ? (
              <div className="space-y-1">
                {loading ? (
                  <div className="py-4 text-center text-xs text-gray-500">Loading...</div>
                ) : sessions.length > 0 ? (
                  sessions.map((session) => {
                    const activeSessionId = pathname?.startsWith("/chat/")
                      ? pathname.split("/")[2] ?? null
                      : null
                    const isActive = activeSessionId === session.session_id
                    const sessionDate = formatSessionDate(session.started_at)

                    return (
                      <div
                        key={session.session_id}
                        className={cn(
                          "group flex items-center gap-3 rounded-md p-3 transition-colors hover:bg-white/10",
                          isActive && "bg-white/10",
                        )}
                      >
                        <Link
                          href={`/chat/${session.session_id}`}
                          prefetch={false}
                          className="flex items-center gap-3 flex-1 min-w-0"
                          onClick={() => {
                            dispatch(setChatSidebarOpen(false))
                          }}
                        >
                          <MessageSquare className="h-4 w-4 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm">Chat Session</div>
                            <div className="text-xs text-gray-400 truncate">{sessionDate}</div>
                            <div className="text-xs text-gray-500 truncate font-mono" title={session.session_id}>
                              {session.session_id.substring(0, 8)}...
                            </div>
                          </div>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div
                              className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 opacity-30 group-hover:opacity-100 transition-opacity flex-shrink-0 relative z-10 rounded-md cursor-pointer"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-[#202123] border-white/10">
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(e) => handleDeleteSession(session.session_id, e)}
                              className="text-red-400 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )
                  })
                ) : (
                  <div className="py-8 text-center text-sm text-gray-500">No sessions yet</div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-1 py-2">
                {sessions.map((session) => {
                  const activeSessionId = pathname?.startsWith("/chat/")
                    ? pathname.split("/")[2] ?? null
                    : null
                  const isActive = activeSessionId === session.session_id
                  return (
                    <Link
                      key={session.session_id}
                      href={`/chat/${session.session_id}`}
                      prefetch={false}
                      title={`Session ${new Date(session.started_at).toLocaleDateString()}\nID: ${session.session_id}`}
                      className={cn(
                        "flex h-10 w-full items-center justify-center rounded-md hover:bg-white/10",
                        isActive && "bg-white/10",
                      )}
                      onClick={() => {
                        dispatch(setChatSidebarOpen(false))
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Link>
                  )
                })}
                {!loading && sessions.length === 0 && (
                  <div className="px-2 text-center text-xs text-gray-500">Expand to view chats</div>
                )}
              </div>
            )}
          </div>

          {/* Footer - User section */}
          <div className="border-t border-white/10">
            {!sidebarCollapsed ? (
              <>
                {/* User Profile Section - Clickable to toggle menu */}
                <div 
                  className="p-3 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setUserMenuExpanded(!userMenuExpanded)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c96a2f] text-sm font-semibold text-white shrink-0">
                      {getUserInitials(user?.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {user?.full_name || "User"}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        @{user?.username || "user"}
                      </div>
                    </div>
                    <ChevronRight 
                      className={cn(
                        "h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0",
                        userMenuExpanded && "rotate-90"
                      )} 
                    />
                  </div>
                </div>

                {/* Menu Options - Animated expand/collapse */}
                <div 
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    userMenuExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="p-2 space-y-1 border-t border-white/10">
                    <Button
                      onClick={() => {
                        setUserMenuExpanded(false)
                        dispatch(setChatSidebarOpen(false))
                      }}
                      variant="ghost"
                      className="w-full justify-start text-white hover:bg-white/10 rounded-md px-3 py-2 h-auto"
                    >
                      <Sparkles className="h-4 w-4 mr-3 shrink-0" />
                      <span className="text-sm">Upgrade plan</span>
                    </Button>

                    <Button
                      onClick={() => {
                        setUserMenuExpanded(false)
                        dispatch(setChatSidebarOpen(false))
                      }}
                      variant="ghost"
                      className="w-full justify-start text-white hover:bg-white/10 rounded-md px-3 py-2 h-auto"
                    >
                      <UserCog className="h-4 w-4 mr-3 shrink-0" />
                      <span className="text-sm">Personalization</span>
                    </Button>

                    <Button
                      onClick={() => {
                        setUserMenuExpanded(false)
                        dispatch(setChatSidebarOpen(false))
                      }}
                      variant="ghost"
                      className="w-full justify-start text-white hover:bg-white/10 rounded-md px-3 py-2 h-auto"
                    >
                      <Settings className="h-4 w-4 mr-3 shrink-0" />
                      <span className="text-sm">Settings</span>
                    </Button>

                    <div className="border-t border-white/10 my-1" />

                    <Button
                      onClick={() => {
                        setUserMenuExpanded(false)
                        dispatch(setChatSidebarOpen(false))
                      }}
                      variant="ghost"
                      className="w-full justify-between text-white hover:bg-white/10 rounded-md px-3 py-2 h-auto"
                    >
                      <div className="flex items-center">
                        <HelpCircle className="h-4 w-4 mr-3 shrink-0" />
                        <span className="text-sm">Help</span>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </Button>

                    <Button
                      onClick={() => {
                        setUserMenuExpanded(false)
                        handleLogout()
                      }}
                      variant="ghost"
                      className="w-full justify-start text-white hover:bg-white/10 rounded-md px-3 py-2 h-auto"
                    >
                      <LogOut className="h-4 w-4 mr-3 shrink-0" />
                      <span className="text-sm">Log out</span>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* Collapsed view - show only user avatar */
              <div className="p-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c96a2f] text-sm font-semibold text-white mx-auto">
                  {getUserInitials(user?.full_name)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
