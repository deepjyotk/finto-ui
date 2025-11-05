"use client"

import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/lib/store"

// Custom hook to sync conversation state with localStorage
export function useConversationSync() {
  const dispatch = useDispatch()
  const { conversations, currentConversationId, messages } = useSelector((state: RootState) => state.chat)

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem("chatgpt-conversations", JSON.stringify(conversations))
    }
  }, [conversations])

  // Save current conversation ID
  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem("chatgpt-current-conversation", currentConversationId)
    }
  }, [currentConversationId])

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem("chatgpt-conversations")
    const savedCurrentId = localStorage.getItem("chatgpt-current-conversation")

    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations)
        // You would dispatch an action to load these conversations
        // This would require adding a loadConversationsFromStorage action to the slice
      } catch (error) {
        console.error("Failed to parse saved conversations:", error)
      }
    }
  }, [dispatch])
}
