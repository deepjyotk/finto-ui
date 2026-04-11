import type { ChatMessage, C1ActionEvent } from "./chat.types"
import type { MessageItem, SessionItem } from "@/features/chat/apis/chat-api"

/* ---------- Helpers ---------- */
export const normalizeApiMessages = (items: MessageItem[] | undefined): ChatMessage[] => {
  if (!items || items.length === 0) return []

  return [...items]
    .sort((a, b) => (a?.seq_no || 0) - (b?.seq_no || 0))
    .map((msg) => {
      const role = (msg?.message_type || "").toLowerCase() === "ai" ? "assistant" : "user"
      const content = msg?.message_payload || ""

      return {
        id: msg?.id || `msg-${msg?.seq_no ?? Math.random()}`,
        role,
        content,
      }
    })
}

export const sanitizeActionMessage = (raw: string) => {
  if (!raw) return ""

  let cleaned = raw.replace(/<context>[\s\S]*?<\/context>/gi, "")

  const contentMatch = cleaned.match(/<content[^>]*>([\s\S]*?)<\/content>/i)
  cleaned = contentMatch ? contentMatch[1] : cleaned

  cleaned = cleaned.replace(/<\/?[^>]+>/g, "").trim()

  return cleaned
}

export const parseC1Action = (action: C1ActionEvent) => {
  const actionType = (action?.type || "").toLowerCase()
  const followUpMessage = sanitizeActionMessage(
    action?.params?.llmFriendlyMessage ||
      action?.llmFriendlyMessage ||
      action?.params?.humanFriendlyMessage ||
      action?.humanFriendlyMessage ||
      (action?.params ? JSON.stringify(action?.params) : "")
  )
  const normalizedMessage = followUpMessage.toLowerCase().trim()

  return {
    actionType,
    followUpMessage,
    normalizedMessage,
    url: action?.params?.url,
  }
}

export const formatSessionDate = (date: string) => {
  const now = new Date()
  const dateObj = new Date(date)
  const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 24) {
    return "Today"
  }
  if (diffInHours < 48) {
    return "Yesterday"
  }
  if (diffInHours < 168) {
    return `${Math.floor(diffInHours / 24)} days ago`
  }
  return dateObj.toLocaleDateString()
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** ChatGPT-style sidebar sections (calendar-based). */
export interface ChatHistorySection {
  tier: number
  label: string
  sessions: SessionItem[]
}

function getHistoryBucket(isoDate: string): { tier: number; label: string } {
  const sessionDate = new Date(isoDate)
  const today = new Date()
  const startToday = startOfLocalDay(today)
  const startSession = startOfLocalDay(sessionDate)
  const diffDays = Math.round((startToday.getTime() - startSession.getTime()) / 86400000)

  if (diffDays < 0) {
    return { tier: 0, label: "Today" }
  }
  if (diffDays === 0) return { tier: 0, label: "Today" }
  if (diffDays === 1) return { tier: 1, label: "Yesterday" }
  if (diffDays <= 7) return { tier: 2, label: "Previous 7 days" }
  if (diffDays <= 30) return { tier: 3, label: "Previous 30 days" }
  return {
    tier: 4,
    label: sessionDate.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
  }
}

/** Group sessions (newest-first from API) into labeled sections like ChatGPT. */
export function groupChatSessionsForSidebar(sessions: SessionItem[]): ChatHistorySection[] {
  const map = new Map<string, ChatHistorySection>()
  for (const s of sessions) {
    const { tier, label } = getHistoryBucket(s.started_at)
    const key = `${tier}:${label}`
    let g = map.get(key)
    if (!g) {
      g = { tier, label, sessions: [] }
      map.set(key, g)
    }
    g.sessions.push(s)
  }
  return [...map.values()].sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier
    const ta = Math.max(...a.sessions.map((x) => new Date(x.started_at).getTime()))
    const tb = Math.max(...b.sessions.map((x) => new Date(x.started_at).getTime()))
    return tb - ta
  })
}

export function truncateChatTitle(text: string, maxLen = 80): string {
  const t = text.trim().replace(/\s+/g, " ")
  if (t.length <= maxLen) return t
  return `${t.slice(0, Math.max(0, maxLen - 1)).trimEnd()}\u2026`
}

/** Primary line for a session row (first user message, or "New chat"). */
export function getSessionDisplayTitle(session: SessionItem, maxLen = 80): string {
  const p = session.preview?.trim()
  if (p) return truncateChatTitle(p, maxLen)
  return "New chat"
}

export const getUserInitials = (fullName?: string | null) => {
  if (!fullName || fullName.trim() === "") return "U"

  const names = fullName.trim().split(" ").filter((name) => name.length > 0)
  if (names.length === 0) return "U"
  if (names.length === 1) return names[0][0].toUpperCase()

  return (names[0][0] + names[names.length - 1][0]).toUpperCase()
}
