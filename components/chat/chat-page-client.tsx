"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import type { SessionItem } from "@/lib/api/chat_api"

// Dynamically import ChatInterface to reduce initial bundle size
// C1Chat and Crayon UI are heavy dependencies that should only load when needed
const ChatInterface = dynamic(() => import("@/components/chat/chat-interface"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-[#050509]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-gray-400">Loading chat interface...</p>
      </div>
    </div>
  ),
})

type ChatPageClientProps = {
  initialSessions?: SessionItem[]
}

export default function ChatPageClient({ initialSessions = [] }: ChatPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sessions, setSessions] = useState<SessionItem[]>(initialSessions)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isNewChat, setIsNewChat] = useState(false)

  useEffect(() => {
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
      setIsNewChat(true)
      router.replace("/chat?new=true")
    }
  }, [searchParams, router])

  const handleNewChat = () => {
    setSelectedSessionId(null)
    setIsNewChat(true)
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
                variant="secondary"
                className="shadow-md hover:brightness-110"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <p className="mb-4">No chat sessions yet</p>
                <Button
                  onClick={handleNewChat}
                  variant="secondary"
                  className="shadow-md hover:brightness-110"
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
                    className="group flex items-start gap-3 rounded-lg p-4 bg-[#202123] hover:bg-[#142135] cursor-pointer transition-colors border border-white/10 hover:border-[#003f7a]"
                  >
                    <div className="flex-shrink-0 p-2 rounded-md bg-[rgba(0,63,122,0.18)]">
                      <MessageSquare className="h-5 w-5 text-[#e6f0ff]" />
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

  return (
    <ChatInterface
      sessionId={selectedSessionId}
      isNewChat={isNewChat || isNewParam || (!selectedSessionId && !sessionParam)}
      onSessionCreated={(sessionId) => {
        setSelectedSessionId(sessionId)
        setIsNewChat(false)
        setSessions((currentSessions) => {
          const alreadyExists = currentSessions.some(
            (session) => session.session_id === sessionId
          )

          if (alreadyExists) {
            return currentSessions
          }

          const newSession: SessionItem = {
            session_id: sessionId,
            started_at: new Date().toISOString(),
          }

          return [newSession, ...currentSessions]
        })
        router.push(`/chat?session=${sessionId}`)
      }}
    />
  )
}
