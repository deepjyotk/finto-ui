import type { SessionItem } from "@/features/chat/apis/chat-api"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
}

export type C1ActionEvent = {
  type?: string
  params?: Record<string, any>
  humanFriendlyMessage?: string
  llmFriendlyMessage?: string
}

export type { SessionItem }

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
  chatPanelOpen: boolean
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
