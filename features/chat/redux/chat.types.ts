import type { SessionItem } from "@/features/chat/apis/chat-api"
import type { A2uiMessage } from "@a2ui/web_core/v0_9"

// ---------------------------------------------------------------------------
// A2UI event types (mirror of backend src/a2ui/schemas.py)
// ---------------------------------------------------------------------------

export type A2UIEventType =
  | "step_start"
  | "step_complete"
  | "tool_call"
  | "tool_result"
  | "a2ui_message"
  | "message_chunk"
  | "message_complete"
  | "hitl_form"
  | "error"

export interface A2UIStepStartPayload {
  step_name: string
  title: string
  description?: string
}

export interface A2UIStepCompletePayload {
  step_name: string
  title: string
  status: "done" | "error"
}

export interface A2UIToolCallPayload {
  tool_name: string
  display_name: string
  step_name: string
  input_summary?: string
}

export interface A2UIToolResultPayload {
  tool_name: string
  step_name: string
  output_summary?: string
  status: "success" | "error"
}

export interface A2UIMessageChunkPayload {
  chunk: string
}

export interface A2UIMessagePayload {
  message: A2uiMessage
}

export interface A2UIMessageCompletePayload {
  content: string
}

export interface A2UIErrorPayload {
  message: string
  code?: string
}

/** LangGraph HITL interrupt metadata for rendering and resuming the A2UI form surface. */
export interface A2UIHitlFormPayload {
  thread_id: string
  surface_id: string
  task?: string
}

export interface A2UIClientEvent {
  event: A2UIEventType
  id: string
  timestamp: string
  payload:
    | A2UIStepStartPayload
    | A2UIStepCompletePayload
    | A2UIToolCallPayload
    | A2UIToolResultPayload
    | A2UIMessagePayload
    | A2UIMessageChunkPayload
    | A2UIMessageCompletePayload
    | A2UIHitlFormPayload
    | A2UIErrorPayload
}

// ---------------------------------------------------------------------------
// Chat message
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
  /** A2UI events accumulated for this message (populated when TheSys is disabled) */
  a2uiEvents?: A2UIClientEvent[]
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
  selectedModelId: string
  chatPanelOpen: boolean
  /** Assistant message id waiting for HITL resume (screener form). */
  hitlResumeAssistantMessageId: string | null
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
