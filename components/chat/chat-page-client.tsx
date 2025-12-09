"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import type { SessionItem } from "@/lib/api/chat_api"
import { createChatSession, getSessionMessages } from "@/lib/api/chat_api"
import ChatDisplay, { type ChatMessage, type C1ActionEvent } from "@/components/chat/chat-display"
import UserTextEnter from "@/components/chat/user-text-enter"

interface ChatPageClientProps {
  initialSessions: SessionItem[]
}

export default function ChatPageClient({ initialSessions }: ChatPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams<{ sessionId?: string }>()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)

  // Initialize session and load messages
  useEffect(() => {
    const initializeSession = async () => {
      // Extract session ID from dynamic route or query params
      const paramsSessionIdRaw = Array.isArray(params?.sessionId)
        ? params?.sessionId[0]
        : params?.sessionId
      const searchSessionId = searchParams?.get("session_id") || searchParams?.get("sessionId")
      const normalizedSessionId = (paramsSessionIdRaw || searchSessionId || "").trim()
      const isNewChat = !normalizedSessionId || normalizedSessionId.toLowerCase() === "new"

      // Always start fresh when resolving session
      setIsLoadingMessages(true)

      if (isNewChat) {
        try {
          const response = await createChatSession()
          const newSessionId = response.session_id
          setSessionId(newSessionId)
          setMessages([])
          // Replace URL with concrete session id to avoid duplicate creations
          router.replace(`/chat/${newSessionId}`)
        } catch (error) {
          console.error("Failed to create session:", error)
        } finally {
          setIsLoadingMessages(false)
        }
        return
      }

      // Load existing session messages
      setSessionId(normalizedSessionId)
      try {
        const sessionData = await getSessionMessages(normalizedSessionId)
        if (sessionData?.messages) {
          // Convert API messages to chat messages
          const chatMessages: ChatMessage[] = []
          let currentUserMessage: string | null = null

          for (const msg of sessionData.messages) {
            try {
              const payload = JSON.parse(msg.message_payload)
              if (payload.role === "user") {
                currentUserMessage = payload.content || ""
              } else if (payload.role === "assistant" && currentUserMessage) {
                // Pair user and assistant messages
                chatMessages.push({
                  id: `user-${msg.seq_no}`,
                  role: "user",
                  content: currentUserMessage,
                })
                chatMessages.push({
                  id: `assistant-${msg.seq_no}`,
                  role: "assistant",
                  content: payload.content || "",
                })
                currentUserMessage = null
              }
            } catch (e) {
              // If parsing fails, treat as plain text
              if (currentUserMessage) {
                chatMessages.push({
                  id: `user-${msg.seq_no}`,
                  role: "user",
                  content: currentUserMessage,
                })
                chatMessages.push({
                  id: `assistant-${msg.seq_no}`,
                  role: "assistant",
                  content: msg.message_payload,
                })
                currentUserMessage = null
              }
            }
          }
          setMessages(chatMessages)
        }
      } catch (error) {
        console.error("Failed to load messages:", error)
      } finally {
        setIsLoadingMessages(false)
      }
    }

    void initializeSession()
  }, [params?.sessionId, searchParams, router])

  const sendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || isLoading || !sessionId) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageContent.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // Add placeholder for assistant response
    const assistantMessageId = `assistant-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        isStreaming: true,
      },
    ])

    try {
      const response = await fetch("/api/thesys/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message_payload: {
            content: userMessage.content,
          },
          session_id: sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`)
      }

      // Check if response is streaming
      const contentType = response.headers.get("content-type") || ""
      if (contentType.includes("text/event-stream")) {
        // Handle streaming response
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (reader) {
          let accumulatedContent = ""

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const cleanedChunk = chunk.replace(/^data:\s*/gm, "")

            if (cleanedChunk.includes("[DONE]")) {
              continue
            }

            accumulatedContent += cleanedChunk
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: accumulatedContent, isStreaming: true }
                  : msg
              )
            )
          }

          // Mark streaming as complete
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
            )
          )
        }
      } else {
        // Handle non-streaming response
        const data = await response.json()
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: data.content || data.message || "No response", isStreaming: false }
              : msg
          )
        )
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: "Sorry, an error occurred. Please try again.", isStreaming: false }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, sessionId])

  const sanitizeActionMessage = (raw: string) => {
    if (!raw) return ""

    // Drop any <context> blocks entirely
    let cleaned = raw.replace(/<context>[\s\S]*?<\/context>/gi, "")

    // If there's a <content> tag, prefer its inner text
    const contentMatch = cleaned.match(/<content[^>]*>([\s\S]*?)<\/content>/i)
    cleaned = contentMatch ? contentMatch[1] : cleaned

    // Strip any remaining tags and trim whitespace
    cleaned = cleaned.replace(/<\/?[^>]+>/g, "").trim()

    return cleaned
  }

  const handleC1Action = useCallback(
    (action: C1ActionEvent) => {
      if (!action) return

      const actionType = (action.type || "").toLowerCase()

      // Non-conversation actions (e.g., open URL)
      if (actionType && actionType !== "continue_conversation") {
        if (actionType === "open_url") {
          const url = action.params?.url
          if (typeof window !== "undefined" && url) {
            window.open(url, "_blank", "noopener,noreferrer")
          }
        }
        return
      }

      const followUpMessage = sanitizeActionMessage(
        action.params?.llmFriendlyMessage ||
          action.llmFriendlyMessage ||
          action.params?.humanFriendlyMessage ||
          action.humanFriendlyMessage ||
          (action.params ? JSON.stringify(action.params) : "")
      )

      if (followUpMessage) {
        void sendMessage(followUpMessage)
      }
    },
    [sendMessage]
  )


  if (isLoadingMessages) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-[var(--chat-surface)] text-[var(--color-foreground)]">
      <ChatDisplay messages={messages} onAction={handleC1Action} />
      <UserTextEnter
        onSendMessage={sendMessage}
        disabled={isLoading}
        sessionId={sessionId}
      />
    </div>
  )
}
