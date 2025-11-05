"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/lib/store"
import { loadConversation, startNewConversation } from "@/lib/features/chat/chat-slice"
import ChatInterface from "@/components/chat/chat-interface"

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useDispatch()
  const { conversations, currentConversationId } = useSelector((state: RootState) => state.chat)

  const conversationId = params.id as string

  useEffect(() => {
    if (conversationId === "new") {
      // Only create new conversation if we don't have a current one
      if (!currentConversationId) {
        dispatch(startNewConversation())
      }
    } else {
      // Check if conversation exists and load it if different from current
      const conversation = conversations.find((c) => c.id === conversationId)
      if (conversation && currentConversationId !== conversationId) {
        dispatch(loadConversation(conversationId))
      } else if (!conversation) {
        // Conversation doesn't exist, redirect to new chat
        router.replace("/")
      }
    }
  }, [conversationId, currentConversationId, dispatch, conversations, router])

  // Handle redirect after new conversation is created
  useEffect(() => {
    if (conversationId === "new" && currentConversationId && currentConversationId !== "new") {
      router.replace(`/chat/${currentConversationId}`)
    }
  }, [conversationId, currentConversationId, router])

  return <ChatInterface />
}
