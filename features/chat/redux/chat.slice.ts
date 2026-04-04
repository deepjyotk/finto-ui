import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { ChatState, ChatMessage, A2UIClientEvent } from "./chat.types"
import type { SessionItem } from "./chat.types"
import {
  initializeChatSession,
  loadChatSessions,
  deleteChatSession,
} from "./chat.thunks"

/* ---------- Initial State ---------- */
const initialState: ChatState = {
  messages: [],
  isLoading: false,
  isLoadingMessages: true,
  sessionId: null,
  lastResolvedSessionKey: null,
  isSubmittingApproval: false,
  sessions: [],
  isLoadingSessions: false,
  sidebarOpen: false,
  sidebarCollapsed: false,
  selectedBrokerId: null,
  selectedModelId: "auto",
  chatPanelOpen: true,
}

/* ---------- Slice ---------- */
const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload)
    },
    updateMessage: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<ChatMessage> }>
    ) => {
      const idx = state.messages.findIndex((msg) => msg.id === action.payload.id)
      if (idx >= 0) {
        state.messages[idx] = { ...state.messages[idx], ...action.payload.changes }
      }
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setIsLoadingMessages: (state, action: PayloadAction<boolean>) => {
      state.isLoadingMessages = action.payload
    },
    setSessionId: (state, action: PayloadAction<string | null>) => {
      state.sessionId = action.payload
    },
    setLastResolvedSessionKey: (state, action: PayloadAction<string | null>) => {
      state.lastResolvedSessionKey = action.payload
    },
    setIsSubmittingApproval: (state, action: PayloadAction<boolean>) => {
      state.isSubmittingApproval = action.payload
    },
    setSessions: (state, action: PayloadAction<SessionItem[]>) => {
      state.sessions = action.payload
    },
    setIsLoadingSessions: (state, action: PayloadAction<boolean>) => {
      state.isLoadingSessions = action.payload
    },
    setChatSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    toggleChatSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setSelectedBrokerId: (state, action: PayloadAction<string | null>) => {
      state.selectedBrokerId = action.payload
    },
    setSelectedModelId: (state, action: PayloadAction<string>) => {
      state.selectedModelId = action.payload
    },
    setChatPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.chatPanelOpen = action.payload
    },
    toggleChatPanelOpen: (state) => {
      state.chatPanelOpen = !state.chatPanelOpen
    },
    appendA2UIEvent: (
      state,
      action: PayloadAction<{ id: string; event: A2UIClientEvent }>
    ) => {
      const msg = state.messages.find((m) => m.id === action.payload.id)
      if (msg) {
        if (!msg.a2uiEvents) msg.a2uiEvents = []
        msg.a2uiEvents.push(action.payload.event)
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeChatSession.pending, (state) => {
        state.isLoadingMessages = true
      })
      .addCase(initializeChatSession.fulfilled, (state, action) => {
        state.sessionId = action.payload.sessionId
        state.messages = action.payload.messages
        state.lastResolvedSessionKey = action.payload.resolvedKey
        state.isLoadingMessages = false
      })
      .addCase(initializeChatSession.rejected, (state) => {
        state.isLoadingMessages = false
      })
      .addCase(loadChatSessions.pending, (state) => {
        state.isLoadingSessions = true
      })
      .addCase(loadChatSessions.fulfilled, (state, action) => {
        state.sessions = action.payload
        state.isLoadingSessions = false
      })
      .addCase(loadChatSessions.rejected, (state) => {
        state.isLoadingSessions = false
      })
      .addCase(deleteChatSession.pending, (state) => {
        state.isLoadingSessions = true
      })
      .addCase(deleteChatSession.fulfilled, (state, action) => {
        state.sessions = action.payload
        state.isLoadingSessions = false
      })
      .addCase(deleteChatSession.rejected, (state) => {
        state.isLoadingSessions = false
      })
  },
})

/* ---------- Exports ---------- */
export const {
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
  toggleChatSidebarCollapsed,
  setSelectedBrokerId,
  setSelectedModelId,
  setChatPanelOpen,
  toggleChatPanelOpen,
  appendA2UIEvent,
} = chatSlice.actions

export default chatSlice.reducer
