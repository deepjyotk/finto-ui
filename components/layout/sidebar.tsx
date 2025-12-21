"use client"

import type React from "react"

import { useSelector, useDispatch } from "react-redux"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import type { RootState } from "@/lib/store"
import { setSidebarOpen, toggleSidebarCollapsed } from "@/lib/slices/ui"
import { logout } from "@/lib/slices/auth"
import { signOut } from "@/lib/auth/session"
import { getSessions, deleteSession, type SessionItem } from "@/lib/api/chat_api"
import { Button } from "@/components/ui/button"
import {
  Plus,
  MessageSquare,
  X,
  MoreHorizontal,
  LogOut,
  Cable,
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

export default function Sidebar() {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const { sidebarOpen, sidebarCollapsed } = useSelector((state: RootState) => state.ui)
  const { user } = useSelector((state: RootState) => state.auth)
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [userMenuExpanded, setUserMenuExpanded] = useState(false)

  useEffect(() => {
    if (pathname?.startsWith("/chat")) {
      loadSessions()
    }
  }, [pathname])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const response = await getSessions()
      setSessions(response.sessions)
    } catch (error) {
      console.error("Failed to load sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = () => {
    router.push("/chat/new")
    dispatch(setSidebarOpen(false))
  }

  const formatDate = (date: string) => {
    const now = new Date()
    const dateObj = new Date(date) // Convert ISO string to Date
    const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return "Today"
    } else if (diffInHours < 48) {
      return "Yesterday"
    } else if (diffInHours < 168) {
      // 7 days
      return `${Math.floor(diffInHours / 24)} days ago`
    } else {
      return dateObj.toLocaleDateString()
    }
  }

  const handleLogout = async () => {
    try {
      const { success, error } = await signOut()
      if (success) {
        dispatch(logout())
        window.location.href = '/'
      } else {
        console.error('Logout error:', error)
      }
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const activeSessionId = pathname?.startsWith("/chat/")
        ? pathname.split("/")[2] ?? null
        : null
      const wasActive = activeSessionId === sessionId
      
      await deleteSession(sessionId)
      // Refresh sessions list
      const response = await getSessions()
      const updatedSessions = response.sessions
      setSessions(updatedSessions)
      
      // If deleted session was the active one, redirect to next available session
      if (wasActive) {
        if (updatedSessions.length > 0) {
          // Redirect to the first session (most recent)
          router.push(`/chat/${updatedSessions[0].session_id}`)
        } else {
          // No sessions left, go to new chat
          router.push("/chat/new")
        }
      }
    } catch (error) {
      console.error("Failed to delete session:", error)
    }
  }

  const getUserInitials = () => {
    if (!user?.full_name || user.full_name.trim() === "") return "U"
    
    // Split by spaces and filter out empty strings
    const names = user.full_name.trim().split(" ").filter(name => name.length > 0)
    
    if (names.length === 0) return "U"
    if (names.length === 1) return names[0][0].toUpperCase()
    
    // Get first and last name initials
    return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  }

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      {/* Sidebar */}
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
                onClick={() => dispatch(toggleSidebarCollapsed())}
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
                onClick={() => dispatch(setSidebarOpen(false))}
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
                    const sessionDate = formatDate(session.started_at)

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
                            dispatch(setSidebarOpen(false))
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
                        dispatch(setSidebarOpen(false))
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
                      {getUserInitials()}
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
                        // TODO: Navigate to upgrade page
                        setUserMenuExpanded(false)
                        dispatch(setSidebarOpen(false))
                      }}
                      variant="ghost"
                      className="w-full justify-start text-white hover:bg-white/10 rounded-md px-3 py-2 h-auto"
                    >
                      <Sparkles className="h-4 w-4 mr-3 shrink-0" />
                      <span className="text-sm">Upgrade plan</span>
                    </Button>

                    <Button
                      onClick={() => {
                        // TODO: Navigate to personalization page
                        setUserMenuExpanded(false)
                        dispatch(setSidebarOpen(false))
                      }}
                      variant="ghost"
                      className="w-full justify-start text-white hover:bg-white/10 rounded-md px-3 py-2 h-auto"
                    >
                      <UserCog className="h-4 w-4 mr-3 shrink-0" />
                      <span className="text-sm">Personalization</span>
                    </Button>

                    <Button
                      onClick={() => {
                        // TODO: Navigate to settings page
                        setUserMenuExpanded(false)
                        dispatch(setSidebarOpen(false))
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
                        // TODO: Navigate to help page or show help menu
                        setUserMenuExpanded(false)
                        dispatch(setSidebarOpen(false))
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
                  {getUserInitials()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
