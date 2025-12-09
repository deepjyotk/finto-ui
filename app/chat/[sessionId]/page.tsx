import { redirect } from "next/navigation"
import { fetchSessionMessages, fetchSessionsServer } from "@/lib/server/chat-sessions"
import ChatPageClient from "@/components/chat/chat-page-client"
import type { SessionItem } from "@/lib/api/chat_api"
import type { ChatMessage } from "@/components/chat/chat-display"

interface ChatSessionPageProps {
  params: {
    sessionId?: string
  }
}

export default async function ChatSessionPage({ params }: ChatSessionPageProps) {
  const rawSessionId = params?.sessionId?.trim() ?? ""
  const normalizedSessionId = rawSessionId.toLowerCase()

  // Normalize missing/empty sessionId to "new"
  if (!rawSessionId) {
    redirect("/chat/new")
  }

  let sessions: SessionItem[] = []
  let initialMessages: ChatMessage[] | undefined
  const isNewSession = normalizedSessionId === "new"

  try {
    sessions = await fetchSessionsServer()
  } catch (error) {
    // Error already logged in fetchSessionsServer, just use empty array
    console.error("Error in ChatSessionPage:", error)
  }

  try {
    if (!isNewSession) {
      const sessionResponse = await fetchSessionMessages(rawSessionId)
      const apiMessages = sessionResponse?.messages ?? []
      initialMessages = apiMessages
        .slice()
        .sort((a, b) => a.seq_no - b.seq_no)
        .map((msg) => ({
          id: msg.id || `msg-${msg.seq_no}`,
          role: (msg.message_type || "").toLowerCase() === "ai" ? "assistant" : "user",
          content: msg.message_payload || "",
        }))
    }
  } catch (error) {
    console.error("Error loading session messages:", error)
    initialMessages = undefined
  }

  return (
    <ChatPageClient
      initialSessions={sessions}
      initialMessages={initialMessages}
      initialSessionId={isNewSession ? null : rawSessionId}
    />
  )
}
