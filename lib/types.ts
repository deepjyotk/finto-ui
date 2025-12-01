export interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: string // ISO string for Redux serialization
  isStreaming?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: string // ISO string for Redux serialization
  updatedAt: string // ISO string for Redux serialization
}

export interface ChatState {
  messages: Message[]
  conversations: Conversation[]
  currentConversationId: string | null
  isLoading: boolean
  error: string | null
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface UIState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  theme: "light" | "dark"
  isTyping: boolean
}
