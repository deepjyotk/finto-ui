"use client"

import type React from "react"

import { useSelector, useDispatch } from "react-redux"
import { useRouter, usePathname } from "next/navigation"
import type { RootState } from "@/lib/store"
import { setSidebarOpen } from "@/lib/features/ui/ui-slice"
import { deleteConversation } from "@/lib/features/chat/chat-slice"
import { logout } from "@/lib/features/auth/auth-slice"
import { signOut } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { Plus, MessageSquare, X, Trash2, MoreHorizontal, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function Sidebar() {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const { sidebarOpen } = useSelector((state: RootState) => state.ui)
  const { conversations, currentConversationId } = useSelector((state: RootState) => state.chat)
  const { user } = useSelector((state: RootState) => state.auth)

  const handleNewChat = () => {
    router.push("/chat/new")
    dispatch(setSidebarOpen(false))
  }

  const handleConversationClick = (conversationId: string) => {
    router.push(`/chat/${conversationId}`)
    dispatch(setSidebarOpen(false))
  }

  const handleDeleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(deleteConversation(conversationId))

    // If we deleted the current conversation, redirect to new chat
    if (currentConversationId === conversationId) {
      router.push("/chat/new")
    }
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
          "fixed left-0 top-0 z-50 h-full w-64 bg-[#202123] text-white transform transition-transform duration-200 ease-in-out",
          "lg:relative lg:z-auto lg:transform-none lg:transition-none lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-3">
            <Button
              onClick={handleNewChat}
              variant="ghost"
              className="flex-1 justify-start text-white hover:bg-white/10 border border-white/20 rounded-md py-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              New chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(setSidebarOpen(false))}
              className="lg:hidden ml-2 text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto px-2 mt-2">
            <div className="space-y-1">
              {conversations.map((conversation) => {
                const isActive = pathname === `/chat/${conversation.id}`

                return (
                  <div
                    key={conversation.id}
                    className={cn(
                      "group flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-white/10 transition-colors",
                      isActive && "bg-white/10",
                    )}
                    onClick={() => handleConversationClick(conversation.id)}
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{conversation.title}</div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-white/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32 bg-[#202123] border-white/10">
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteConversation(conversation.id, e)}
                          className="text-red-400 focus:text-red-400 hover:bg-white/10"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}

              {conversations.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-8">No conversations yet</div>
              )}
            </div>
          </div>

          {/* Footer - User section */}
          <div className="p-2 border-t border-white/10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10 cursor-pointer">
                  <div className="w-8 h-8 rounded-sm bg-[#c96a2f] flex items-center justify-center text-white text-xs font-semibold">
                    {getUserInitials()}
                  </div>
                  <div className="flex-1 text-sm truncate">{user?.full_name || "User"}</div>
                  <MoreHorizontal className="h-4 w-4" />
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
