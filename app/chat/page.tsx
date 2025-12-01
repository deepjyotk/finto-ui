"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api/client"
import type { SessionItem } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Plus, MessageSquare } from "lucide-react"
import ChatInterface from "@/components/chat/chat-interface"

export default function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isNewChat, setIsNewChat] = useState(false)

  useEffect(() => {
    loadSessions()
    
    // Check URL params for session selection or new chat
    const sessionParam = searchParams?.get("session")
    const isNewParam = searchParams?.get("new") === "true"
    
    if (sessionParam) {
      setSelectedSessionId(sessionParam)
      setIsNewChat(false)
    } else if (isNewParam) {
      setSelectedSessionId(null)
      setIsNewChat(true)
    } else {
      setSelectedSessionId(null)
      setIsNewChat(false)
    }
  }, [searchParams])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getSessions()
      setSessions(response.sessions)
    } catch (error) {
      console.error("Failed to load sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = () => {
    setSelectedSessionId(null)
    setIsNewChat(true)
    // Navigate to chat with new=true to indicate new chat
    router.push("/chat?new=true")
  }

  const handleSessionClick = (sessionId: string) => {
    setSelectedSessionId(sessionId)
    setIsNewChat(false)
    router.push(`/chat?session=${sessionId}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return "Today"
    } else if (diffInHours < 48) {
      return "Yesterday"
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Show session list when no session is selected and not explicitly starting a new chat
  const sessionParam = searchParams?.get("session")
  const isNewParam = searchParams?.get("new") === "true"
  const showSessionList = !selectedSessionId && !isNewChat && !sessionParam && !isNewParam

  if (showSessionList) {
    return (
      <div className="flex flex-col h-full bg-[#050509]">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-white">Chat Sessions</h1>
              <Button
                onClick={handleNewChat}
                variant="ghost"
                className="border border-white/20 text-white hover:bg-white/10"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>

            {loading ? (
              <div className="text-center text-gray-400 py-12">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <p className="mb-4">No chat sessions yet</p>
                <Button
                  onClick={handleNewChat}
                  variant="ghost"
                  className="border border-white/20 text-white hover:bg-white/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start a new chat
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.map((session) => (
                  <div
                    key={session.session_id}
                    onClick={() => handleSessionClick(session.session_id)}
                    className="group flex items-start gap-3 rounded-lg p-4 bg-[#202123] hover:bg-[#2a2b2e] cursor-pointer transition-colors border border-white/10"
                  >
                    <div className="flex-shrink-0 p-2 bg-white/10 rounded-md">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        Chat Session
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(session.started_at)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-mono truncate" title={session.session_id}>
                        {session.session_id}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Show chat interface when a session is selected or new chat is active
  return (
    <ChatInterface
      sessionId={selectedSessionId}
      isNewChat={isNewChat || isNewParam || (!selectedSessionId && !sessionParam)}
      onSessionCreated={(sessionId) => {
        setSelectedSessionId(sessionId)
        setIsNewChat(false)
        router.push(`/chat?session=${sessionId}`)
        loadSessions() // Reload sessions to include the new one
      }}
    />
  )
}
