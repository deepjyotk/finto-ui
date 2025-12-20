import "server-only"

import { cookies } from "next/headers"
import type {
  MessageItem,
  SessionItem,
  SessionMessagesResponse,
  SessionsListResponse,
  ChatMetadataResponse,
} from "@/lib/api/chat_api"

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000"

const buildCookieHeader = async (): Promise<Record<string, string>> => {
  const cookieStore = await cookies()
  const cookiePairs: string[] = []

  cookieStore.getAll().forEach((cookie) => {
    cookiePairs.push(`${cookie.name}=${cookie.value}`)
  })

  const cookieHeader = cookiePairs.join("; ")
  return cookieHeader ? { Cookie: cookieHeader } : { Cookie: "" }
}

export async function fetchSessionsServer(): Promise<SessionItem[]> {
  try {
    const headers = await buildCookieHeader()
    const response = await fetch(`${FASTAPI_BASE_URL}/api/v1/thesys/session`, {
      method: "GET",
      headers,
      cache: "no-store",
      credentials: "include",
    })

    if (!response.ok) {
      // Log the error but don't throw - return empty array instead
      const errorText = await response.text().catch(() => response.statusText)
      console.error(
        `Failed to fetch sessions: ${response.status} ${response.statusText}`,
        errorText ? `Response: ${errorText}` : ""
      )
      return []
    }

    const data: SessionsListResponse = await response.json()
    return data.sessions ?? []
  } catch (error) {
    // Handle network errors, JSON parsing errors, etc.
    console.error("Failed to load chat sessions:", error)
    return []
  }
}

export async function fetchSessionMessages(sessionId: string): Promise<SessionMessagesResponse | null> {
  if (!sessionId) {
    return null
  }

  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/v1/thesys/session/${sessionId}`, {
      method: "GET",
      headers: await buildCookieHeader(),
      cache: "no-store",
      credentials: "include",
    })

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch session: ${response.status} ${response.statusText}`)
    }

    const data: SessionMessagesResponse = await response.json()
    return data
  } catch (error) {
    console.error(`Failed to load chat session ${sessionId}:`, error)
    return null
  }
}

export async function fetchChatMetadataServer(): Promise<ChatMetadataResponse> {
  try {
    const headers = await buildCookieHeader()
    const response = await fetch(`${FASTAPI_BASE_URL}/api/v1/thesys/chat_metadata`, {
      method: "GET",
      headers,
      cache: "no-store",
      credentials: "include",
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      console.error(
        `Failed to fetch chat metadata: ${response.status} ${response.statusText}`,
        errorText ? `Response: ${errorText}` : ""
      )
      return { brokers: [] }
    }

    const data: ChatMetadataResponse = await response.json()
    return data
  } catch (error) {
    console.error("Failed to load chat metadata:", error)
    return { brokers: [] }
  }
}
