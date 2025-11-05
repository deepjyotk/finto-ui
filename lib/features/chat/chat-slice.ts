import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  isStreaming?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface ChatState {
  messages: Message[]
  conversations: Conversation[]
  currentConversationId: string | null
  isLoading: boolean
  error: string | null
}

const initialState: ChatState = {
  messages: [],
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  error: null,
}

// Generate conversation title from first message
const generateConversationTitle = (firstMessage: string): string => {
  const words = firstMessage.split(" ").slice(0, 6)
  return words.length < firstMessage.split(" ").length ? words.join(" ") + "..." : words.join(" ")
}

export const sendMessage = createAsyncThunk("chat/sendMessage", async (content: string) => {
  // Call A2A agent server directly (no Next.js proxy)
  const A2A_BASE_URL = process.env.NEXT_PUBLIC_A2A_AGENT_BASE_URL || "http://localhost:8080"
  
  const response = await fetch(`${A2A_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: content }),
  })

  if (!response.ok) {
    throw new Error("Failed to send message")
  }

  const data = await response.json()
  return data
})

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload)

      // If this is the first user message and we have a current conversation, update its title
      if (action.payload.role === "user" && state.currentConversationId) {
        const conversation = state.conversations.find((c) => c.id === state.currentConversationId)
        if (conversation && conversation.messages.length === 0) {
          conversation.title = generateConversationTitle(action.payload.content)
        }
      }
    },

    updateMessage: (state, action: PayloadAction<{ id: string; content: string }>) => {
      const message = state.messages.find((m) => m.id === action.payload.id)
      if (message) {
        message.content = action.payload.content
      }
    },

    setStreaming: (state, action: PayloadAction<{ id: string; isStreaming: boolean }>) => {
      const message = state.messages.find((m) => m.id === action.payload.id)
      if (message) {
        message.isStreaming = action.payload.isStreaming
      }
    },

    startNewConversation: (state) => {
      // Save current conversation if it has messages
      if (state.messages.length > 0 && state.currentConversationId) {
        const existingConversation = state.conversations.find((c) => c.id === state.currentConversationId)
        if (existingConversation) {
          existingConversation.messages = [...state.messages]
          existingConversation.updatedAt = new Date()
        }
      }

      // Create new conversation with predictable ID
      const newConversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newConversation: Conversation = {
        id: newConversationId,
        title: "New conversation",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      state.conversations.unshift(newConversation)
      state.currentConversationId = newConversationId
      state.messages = []
    },

    loadConversation: (state, action: PayloadAction<string>) => {
      // Save current conversation before switching
      if (state.messages.length > 0 && state.currentConversationId) {
        const currentConversation = state.conversations.find((c) => c.id === state.currentConversationId)
        if (currentConversation) {
          currentConversation.messages = [...state.messages]
          currentConversation.updatedAt = new Date()
        }
      }

      // Load the requested conversation
      const conversation = state.conversations.find((c) => c.id === action.payload)
      if (conversation) {
        state.currentConversationId = conversation.id
        state.messages = [...conversation.messages]
      }
    },

    deleteConversation: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter((c) => c.id !== action.payload)

      // If we deleted the current conversation, start a new one
      if (state.currentConversationId === action.payload) {
        state.currentConversationId = null
        state.messages = []
      }
    },

    clearMessages: (state) => {
      state.messages = []
      state.currentConversationId = null
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false
        state.messages.push(action.payload)
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || "Failed to send message"
      })
  },
})

export const {
  addMessage,
  updateMessage,
  setStreaming,
  startNewConversation,
  loadConversation,
  deleteConversation,
  clearMessages,
  setError,
} = chatSlice.actions

export default chatSlice.reducer
