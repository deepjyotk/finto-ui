"use client"

import type React from "react"

import { useSelector, useDispatch } from "react-redux"
import { useRouter, usePathname } from "next/navigation"
import type { RootState } from "@/lib/store"
import { setSidebarOpen } from "@/lib/features/ui/ui-slice"
import { deleteConversation } from "@/lib/features/chat/chat-slice"
import { Button } from "@/components/ui/button"
import { Plus, MessageSquare, X, Trash2, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function Sidebar() {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const { sidebarOpen } = useSelector((state: RootState) => state.ui)
  const { conversations, currentConversationId } = useSelector((state: RootState) => state.chat)

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

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return "Today"
    } else if (diffInHours < 48) {
      return "Yesterday"
    } else if (diffInHours < 168) {
      // 7 days
      return `${Math.floor(diffInHours / 24)} days ago`
    } else {
      return new Date(date).toLocaleDateString()
    }
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
          "fixed left-0 top-0 z-50 h-full w-64 bg-gray-900 text-white transform transition-transform duration-200 ease-in-out",
          "lg:relative lg:z-auto lg:transform-none lg:transition-none lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold">Finto</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(setSidebarOpen(false))}
              className="lg:hidden text-white hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <Button
              onClick={handleNewChat}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              New chat
            </Button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto px-4">
            <div className="space-y-1">
              {conversations.map((conversation) => {
                const isActive = pathname === `/chat/${conversation.id}`

                return (
                  <div
                    key={conversation.id}
                    className={cn(
                      "group flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-800 transition-colors",
                      isActive && "bg-gray-800",
                    )}
                    onClick={() => handleConversationClick(conversation.id)}
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{conversation.title}</div>
                      <div className="text-xs text-gray-400">{formatDate(conversation.updatedAt)}</div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteConversation(conversation.id, e)}
                          className="text-red-600 focus:text-red-600"
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
                <div className="text-center text-gray-400 text-sm py-8">No conversations yet</div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <div className="text-xs text-gray-400">Finto v1.0</div>
          </div>
        </div>
      </div>
    </>
  )
}
