import ChatPageClient from "@/components/chat/chat-page-client"
import type { SessionItem, SessionsListResponse } from "@/lib/api/chat_api"
import { cookies } from "next/headers"

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000"

async function fetchSessions(): Promise<SessionItem[]> {
  try {
    const cookieHeader = cookies().toString()

    const response = await fetch(`${FASTAPI_BASE_URL}/api/v1/thesys/session`, {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.status} ${response.statusText}`)
    }

    const data: SessionsListResponse = await response.json()
    return data.sessions ?? []
  } catch (error) {
    console.error("Failed to load chat sessions:", error)
    return []
  }
}

export default async function ChatPage() {
  const sessions = await fetchSessions()

  return <ChatPageClient initialSessions={sessions} />
}
