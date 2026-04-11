"use client"

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react"

type ChatShellContextValue = {
  registerSessionSearchFocus: (fn: () => void) => void
  focusSessionSearch: () => void
}

const ChatShellContext = createContext<ChatShellContextValue | null>(null)

export function ChatShellProvider({ children }: { children: ReactNode }) {
  const focusFnRef = useRef<(() => void) | null>(null)

  const registerSessionSearchFocus = useCallback((fn: () => void) => {
    focusFnRef.current = fn
  }, [])

  const focusSessionSearch = useCallback(() => {
    focusFnRef.current?.()
  }, [])

  return (
    <ChatShellContext.Provider
      value={{ registerSessionSearchFocus, focusSessionSearch }}
    >
      {children}
    </ChatShellContext.Provider>
  )
}

export function useChatShell(): ChatShellContextValue {
  const ctx = useContext(ChatShellContext)
  if (!ctx) {
    throw new Error("useChatShell must be used within ChatShellProvider")
  }
  return ctx
}

export function useOptionalChatShell(): ChatShellContextValue | null {
  return useContext(ChatShellContext)
}
