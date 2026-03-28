"use client"

import dynamic from "next/dynamic"
import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Loader2, Menu } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import type { SessionItem, UserBrokerItem } from "@/features/chat/apis/chat-api"
import type { ChatMessage } from "@/features/chat/components/chat-display"
import UserTextEnter from "@/features/chat/components/user-text-enter"
import BrokerSelectionModal from "@/features/chat/components/broker-selection-modal"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import type { AppDispatch } from "@/lib/store"
import {
  initializeChatSession,
  sendMessage,
  selectIsChatLoading,
  selectIsChatLoadingMessages,
  selectChatSessionId,
  selectSelectedBrokerId,
  setSelectedBrokerId,
  toggleChatSidebarOpen,
} from "@/features/chat/redux"

const ChatDisplay = dynamic(
  () => import("@/features/chat/components/chat-display").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 overflow-y-auto">
        <div className="flex h-full items-center justify-center text-gray-400">Loading chat...</div>
      </div>
    ),
  }
)

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
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchParamsKey = searchParams?.toString()
  const params = useParams<{ sessionId?: string }>()
  const { toast } = useToast()
  const isLoading = useSelector(selectIsChatLoading)
  const isLoadingMessages = useSelector(selectIsChatLoadingMessages)
  const sessionId = useSelector(selectChatSessionId)
  const selectedBrokerId = useSelector(selectSelectedBrokerId)

  const [showBrokerModal, setShowBrokerModal] = useState(false)
  const brokerInitializedRef = useRef(false)

  useEffect(() => {
    if (brokerInitializedRef.current) return
    brokerInitializedRef.current = true

    if (brokers.length === 0) {
      toast({
        title: "No broker integration found",
        description: "Connect a broker to access portfolio features. You can still ask general finance questions.",
        variant: "default",
      })
    } else if (brokers.length === 1) {
      dispatch(setSelectedBrokerId(brokers[0].broker_id))
    } else {
      setShowBrokerModal(true)
    }
  }, [brokers, toast, dispatch])

  const handleBrokerSelect = useCallback((brokerId: string) => {
    dispatch(setSelectedBrokerId(brokerId))
    setShowBrokerModal(false)
  }, [dispatch])

  useEffect(() => {
    dispatch(
      initializeChatSession({
        paramsSessionId: params?.sessionId,
        searchParamsKey,
        initialMessages,
        initialSessionId,
        router,
      })
    )
  }, [
    params?.sessionId,
    searchParamsKey,
    router,
    initialMessages,
    initialSessionId,
    dispatch,
  ])

  const handleSendMessage = useCallback(
    async (messageContent: string) => {
      if (!messageContent.trim() || isLoading || !sessionId) return

      if (!selectedBrokerId && brokers.length > 1) {
        setShowBrokerModal(true)
        return
      }

      await dispatch(sendMessage({ content: messageContent }))
    },
    [dispatch, isLoading, sessionId, selectedBrokerId, brokers]
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => dispatch(toggleChatSidebarOpen())}
          className="fixed top-4 left-4 z-50 lg:hidden bg-[#202123]/90 backdrop-blur-sm text-white hover:bg-[#202123] border border-white/10 shadow-lg"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <ChatDisplay />
        <UserTextEnter
          onSendMessage={handleSendMessage}
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
