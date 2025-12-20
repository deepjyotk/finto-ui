"use client"

import dynamic from "next/dynamic"
import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Loader2, Menu } from "lucide-react"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/lib/store"
import { toggleSidebar } from "@/lib/slices/ui"
import type { MessageItem, SessionItem, UserBrokerItem } from "@/lib/api/chat_api"
import { createChatSession, getSessionMessages } from "@/lib/api/chat_api"
import type { ChatMessage, C1ActionEvent } from "@/components/chat/chat-display"
import UserTextEnter from "@/components/chat/user-text-enter"
import BrokerSelectionModal from "@/components/chat/broker-selection-modal"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

// Avoid SSR for ChatDisplay to prevent hydration mismatches from SDK-generated styles
const ChatDisplay = dynamic(
  () => import("@/components/chat/chat-display").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 overflow-y-auto">
        <div className="flex h-full items-center justify-center text-gray-400">Loading chat...</div>
      </div>
    ),
  }
)

const isThesysEnabled =
  (process.env.NEXT_PUBLIC_THESYS_ENABLED ?? "true").toLowerCase() === "true"

interface ChatPageClientProps {
  initialSessions: SessionItem[]
  initialMessages?: ChatMessage[]
  initialSessionId?: string | null
  brokers: UserBrokerItem[]
}

export default function ChatPageClient({
  initialSessions: _initialSessions,
  initialMessages,
  initialSessionId = null,
  brokers,
}: ChatPageClientProps) {
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchParamsKey = searchParams?.toString()
  const params = useParams<{ sessionId?: string }>()
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? [])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId)
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const lastResolvedSessionRef = useRef<string | null>(null)
  
  // Broker selection state
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(null)
  const [showBrokerModal, setShowBrokerModal] = useState(false)
  const brokerInitializedRef = useRef(false)

  const normalizeApiMessages = useCallback((items: MessageItem[] | undefined): ChatMessage[] => {
    if (!items || items.length === 0) return []

    return [...items]
      .sort((a, b) => (a?.seq_no || 0) - (b?.seq_no || 0))
      .map((msg) => {
        const role = (msg?.message_type || "").toLowerCase() === "ai" ? "assistant" : "user"

        const content = msg?.message_payload || ""

        return {
          id: msg?.id || `msg-${msg?.seq_no ?? Math.random()}`,
          role,
          content,
        }
      })
  }, [])

  // Handle broker selection on mount
  useEffect(() => {
    if (brokerInitializedRef.current) return
    brokerInitializedRef.current = true

    if (brokers.length === 0) {
      // No brokers available - show toast
      toast({
        title: "No broker integration found",
        description: "Connect a broker to access portfolio features. You can still ask general finance questions.",
        variant: "default",
      })
    } else if (brokers.length === 1) {
      // Single broker - auto-select
      setSelectedBrokerId(brokers[0].broker_id)
    } else {
      // Multiple brokers - show modal
      setShowBrokerModal(true)
    }
  }, [brokers, toast])

  const handleBrokerSelect = useCallback((brokerId: string) => {
    setSelectedBrokerId(brokerId)
    setShowBrokerModal(false)
  }, [])

  // Initialize session and load messages
  useEffect(() => {
    const initializeSession = async () => {
      // Extract session ID from dynamic route or query params
      const paramsSessionIdRaw = Array.isArray(params?.sessionId)
        ? params?.sessionId[0]
        : params?.sessionId
      const urlSearchParams = new URLSearchParams(searchParamsKey || "")
      const searchSessionId = urlSearchParams.get("session_id") || urlSearchParams.get("sessionId")
      const normalizedSessionId = (paramsSessionIdRaw || searchSessionId || "").trim()
      const sessionResolutionKey = normalizedSessionId || "new"

      // Avoid re-running initialization for the same session (prevents duplicate creations)
      if (lastResolvedSessionRef.current === sessionResolutionKey) {
        return
      }
      lastResolvedSessionRef.current = sessionResolutionKey
      const isNewChat = !normalizedSessionId || normalizedSessionId.toLowerCase() === "new"

      // Always start fresh when resolving session
      setIsLoadingMessages(true)

      const hasPrefetchedSession =
        !!initialSessionId &&
        !!normalizedSessionId &&
        normalizedSessionId === initialSessionId &&
        initialMessages !== undefined

      if (hasPrefetchedSession) {
        setSessionId(initialSessionId)
        setMessages(initialMessages ?? [])
        setIsLoadingMessages(false)
        return
      }

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
          setMessages(normalizeApiMessages(sessionData.messages))
        } else {
          setMessages([])
        }
      } catch (error) {
        console.error("Failed to load messages:", error)
      } finally {
        setIsLoadingMessages(false)
      }
    }

    void initializeSession()
  }, [
    params?.sessionId,
    searchParamsKey,
    router,
    initialMessages,
    initialSessionId,
    normalizeApiMessages,
  ])

  const sendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || isLoading || !sessionId) return

    // Show warning if no broker is selected but allow general questions
    if (!selectedBrokerId && brokers.length > 0) {
      // If there are brokers but none selected, prompt selection
      if (brokers.length > 1) {
        setShowBrokerModal(true)
        return
      }
    }

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
      // Use selected broker or empty string for general questions (no broker integration)
      const brokerId = selectedBrokerId || ""
      
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
          broker_id: brokerId,
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
  }, [isLoading, sessionId, selectedBrokerId, brokers])

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
    <>
      <div className="flex h-full flex-col bg-[var(--chat-surface)] text-[var(--color-foreground)] relative">
        {/* Mobile menu button - only visible on small screens */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => dispatch(toggleSidebar())}
          className="fixed top-4 left-4 z-50 lg:hidden bg-[#202123]/90 backdrop-blur-sm text-white hover:bg-[#202123] border border-white/10 shadow-lg"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <ChatDisplay messages={messages} onAction={isThesysEnabled ? handleC1Action : undefined} />
        <UserTextEnter
          onSendMessage={sendMessage}
          disabled={isLoading}
          sessionId={sessionId}
        />
      </div>
      
      {brokers.length > 1 && (
        <BrokerSelectionModal
          open={showBrokerModal}
          onClose={() => setShowBrokerModal(false)}
          brokers={brokers}
          onSelectBroker={handleBrokerSelect}
        />
      )}
    </>
  )
}
