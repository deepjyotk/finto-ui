import type { RootState } from "@/lib/store"

/* ---------- Selectors ---------- */
export const selectChatState = (state: RootState) => state.chat
export const selectChatMessages: (state: RootState) => RootState["chat"]["messages"] = (state) =>
  state.chat.messages
export const selectIsChatLoading: (state: RootState) => boolean = (state) => state.chat.isLoading
export const selectIsChatLoadingMessages: (state: RootState) => boolean = (state) =>
  state.chat.isLoadingMessages
export const selectChatSessionId: (state: RootState) => string | null = (state) =>
  state.chat.sessionId
export const selectIsSubmittingApproval = (state: RootState) => state.chat.isSubmittingApproval
export const selectChatSessions = (state: RootState) => state.chat.sessions
export const selectIsChatSessionsLoading = (state: RootState) => state.chat.isLoadingSessions
export const selectChatSidebarOpen = (state: RootState) => state.chat.sidebarOpen
export const selectChatSidebarCollapsed = (state: RootState) => state.chat.sidebarCollapsed
export const selectSelectedBrokerId = (state: RootState) => state.chat.selectedBrokerId
export const selectSelectedModelId = (state: RootState) => state.chat.selectedModelId
export const selectChatPanelOpen = (state: RootState) => state.chat.chatPanelOpen
