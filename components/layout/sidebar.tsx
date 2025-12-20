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
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-sm font-semibold">
                F
              </div>
              {!sidebarCollapsed && <span className="text-sm font-semibold">Finto</span>}
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
          <div className="p-2 border-t border-white/10 space-y-1">
            <Button
              onClick={() => {
                router.push("/integrations")
                dispatch(setSidebarOpen(false))
              }}
              variant="ghost"
              className={cn(
                "w-full text-white hover:bg-white/10 rounded-md",
                sidebarCollapsed ? "justify-center px-2" : "justify-start",
              )}
            >
              <Cable className="h-4 w-4 mr-2" />
              {!sidebarCollapsed && <span>Integrations</span>}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-white/10",
                    sidebarCollapsed && "justify-center",
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#c96a2f] text-xs font-semibold text-white">
                    {getUserInitials()}
                  </div>
                  {!sidebarCollapsed && (
                    <>
                      <div className="flex-1 truncate text-sm">{user?.full_name || "User"}</div>
                      <MoreHorizontal className="h-4 w-4" />
                    </>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#202123] border-white/10">
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-white hover:bg-white/10 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  )
}
