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
} from "./chat.slice"

// Thunks
export {
  initializeChatSession,
  sendMessage,
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
  selectSelectedBrokerId,
} from "./chat.selectors"

// Types
export type {
  ChatState,
  ChatMessage,
  C1ActionEvent,
  SessionItem,
  InitializeChatArgs,
  InitializeChatPayload,
} from "./chat.types"

// Helpers
export {
  normalizeApiMessages,
  sanitizeActionMessage,
  parseC1Action,
  formatSessionDate,
  getUserInitials,
} from "./chat.helpers"
