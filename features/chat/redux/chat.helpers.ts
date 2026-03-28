import type { ChatMessage, C1ActionEvent } from "./chat.types"
import type { MessageItem } from "@/features/chat/apis/chat-api"

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

export const getUserInitials = (fullName?: string | null) => {
  if (!fullName || fullName.trim() === "") return "U"

  const names = fullName.trim().split(" ").filter((name) => name.length > 0)
  if (names.length === 0) return "U"
  if (names.length === 1) return names[0][0].toUpperCase()

  return (names[0][0] + names[names.length - 1][0]).toUpperCase()
}
