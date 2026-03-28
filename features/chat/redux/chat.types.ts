import type { ChatMessage, C1ActionEvent } from "@/features/chat/components/chat-display"
import type { SessionItem } from "@/features/chat/apis/chat-api"

export type { ChatMessage, C1ActionEvent } from "@/features/chat/components/chat-display"
export type { SessionItem } from "@/features/chat/apis/chat-api"

/* ---------- State ---------- */
export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  isLoadingMessages: boolean
  sessionId: string | null
  lastResolvedSessionKey: string | null
  isSubmittingApproval: boolean
  sessions: SessionItem[]
  isLoadingSessions: boolean
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  selectedBrokerId: string | null
}

/* ---------- Thunk Types ---------- */
export type InitializeChatArgs = {
  paramsSessionId?: string | string[]
  searchParamsKey?: string | null
  initialMessages?: ChatMessage[]
  initialSessionId?: string | null
  router: { replace: (path: string) => void }
}

export type InitializeChatPayload = {
  sessionId: string | null
  messages: ChatMessage[]
  resolvedKey: string
}
