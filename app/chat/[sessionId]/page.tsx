import { redirect } from "next/navigation"
import { fetchSessionsServer } from "@/lib/server/chat-sessions"
import ChatPageClient from "@/components/chat/chat-page-client"
import type { SessionItem } from "@/lib/api/chat_api"

interface ChatSessionPageProps {
  params: {
    sessionId?: string
  }
}

export default async function ChatSessionPage({ params }: ChatSessionPageProps) {
  const rawSessionId = params?.sessionId?.trim() ?? ""

  // Normalize missing/empty sessionId to "new"
  if (!rawSessionId) {
    redirect("/chat/new")
  }

  let sessions: SessionItem[] = []

  try {
    sessions = await fetchSessionsServer()
  } catch (error) {
    // Error already logged in fetchSessionsServer, just use empty array
    console.error("Error in ChatSessionPage:", error)
  }

  return <ChatPageClient initialSessions={sessions} />
}

