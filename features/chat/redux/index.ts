/* ---------- Public Exports ---------- */

// Reducer
export { default as chatReducer } from "./chat.slice"

// Actions
export {
  setMessages,
  addMessage,
  updateMessage,
  setIsLoading,
  setIsLoadingMessages,
  setSessionId,
  setLastResolvedSessionKey,
  setIsSubmittingApproval,
  setSessions,
  setIsLoadingSessions,
  setChatSidebarOpen,
  setSelectedBrokerId,
  setSelectedModelId,
  setChatPanelOpen,
  toggleChatPanelOpen,
  appendA2UIEvent,
  setHitlResumeAssistantMessageId,
  clearHitlResume,
} from "./chat.slice"

// Thunks
export {
  initializeChatSession,
  sendMessage,
  resumeA2UIChat,
  abortChatSend,
  loadChatSessions,
  deleteChatSession,
  performLogout,
  toggleChatSidebarOpen,
  toggleChatSidebarCollapsed,
  startNewChat,
} from "./chat.thunks"

// Selectors
export {
  selectChatState,
  selectChatMessages,
  selectIsChatLoading,
  selectIsChatLoadingMessages,
  selectChatSessionId,
  selectIsSubmittingApproval,
  selectChatSessions,
  selectIsChatSessionsLoading,
  selectChatSidebarOpen,
  selectChatSidebarCollapsed,
  selectSelectedBrokerId,
  selectSelectedModelId,
  selectChatPanelOpen,
  selectHitlResumeAssistantMessageId,
} from "./chat.selectors"

// Types
export type {
  ChatState,
  ChatMessage,
  C1ActionEvent,
  SessionItem,
  InitializeChatArgs,
  InitializeChatPayload,
  A2UIClientEvent,
  A2UIEventType,
} from "./chat.types"

// Helpers
export {
  normalizeApiMessages,
  sanitizeActionMessage,
  parseC1Action,
  formatSessionDate,
  getUserInitials,
  groupChatSessionsForSidebar,
  truncateChatTitle,
  getSessionDisplayTitle,
} from "./chat.helpers"
export type { ChatHistorySection } from "./chat.helpers"
