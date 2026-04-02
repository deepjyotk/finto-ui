"use client"

import dynamic from "next/dynamic"
import { useEffect, useCallback, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import type { ImperativePanelHandle } from "react-resizable-panels"
import type { SessionItem, UserBrokerItem, ChatModeItem, LLMModelItem } from "@/features/chat/apis/chat-api"
import type { ChatMessage } from "@/features/chat/components/chat-display"
import { useToast } from "@/hooks/use-toast"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import type { AppDispatch } from "@/lib/store"
import {
  initializeChatSession,
  sendMessage,
  abortChatSend,
  selectIsChatLoading,
  selectIsChatLoadingMessages,
  selectChatSessionId,
  selectChatPanelOpen,
  selectChatSessions,
  setSelectedBrokerId,
  setChatPanelOpen,
  setSessions,
} from "@/features/chat/redux"
import { FEATURE_FLAGS } from "@/lib/feature-flags"

const ChatPanel = dynamic(
  () => import("@/features/chat/components/chat-panel"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#0B0F14]">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    ),
  }
)

const DataPreviewPanel = dynamic(
  () => import("@/features/chat/components/data-preview-panel"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#0B0F14]">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    ),
  }
)

interface ChatPageClientProps {
  initialSessions: SessionItem[]
  initialMessages?: ChatMessage[]
  initialSessionId?: string | null
  brokers: UserBrokerItem[]
  chatModes: ChatModeItem[]
  llmModels: LLMModelItem[]
}

export default function ChatPageClient({
  initialSessions,
  initialMessages,
  initialSessionId = null,
  brokers,
  chatModes,
  llmModels,
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
  const chatPanelOpen = useSelector(selectChatPanelOpen)
  const sessions = useSelector(selectChatSessions)

  const chatPanelRef = useRef<ImperativePanelHandle>(null)
  const brokerInitializedRef = useRef(false)

  // Sync Redux chatPanelOpen → imperative panel API
  useEffect(() => {
    if (!chatPanelRef.current) return
    if (chatPanelOpen) {
      chatPanelRef.current.expand()
    } else {
      chatPanelRef.current.collapse()
    }
  }, [chatPanelOpen])

  useEffect(() => {
    if (initialSessions.length > 0) {
      dispatch(setSessions(initialSessions))
    }
  }, [initialSessions, dispatch])

  useEffect(() => {
    if (brokerInitializedRef.current) return
    brokerInitializedRef.current = true

    if (brokers.length === 0) {
      toast({
        title: "No broker integration found",
        description:
          "Connect a broker to access portfolio features. You can still ask general finance questions.",
        variant: "default",
      })
    } else {
      dispatch(setSelectedBrokerId(brokers[0].broker_id))
    }
  }, [brokers, toast, dispatch])

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
    async (messageContent: string, modelId: string) => {
      if (!messageContent.trim() || isLoading || !sessionId) return

      await dispatch(sendMessage({ content: messageContent, modelId }))
    },
    [dispatch, isLoading, sessionId]
  )

  const handleStopSend = useCallback(() => {
    abortChatSend()
  }, [])

  if (isLoadingMessages) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  // ── Old / classic UI ────────────────────────────────────────────────────────
  if (!FEATURE_FLAGS.CURSOR_STYLE_UI_ENABLED) {
    return (
      <div className="flex h-full flex-col bg-[#0B0F14]">
        <ChatPanel
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          onStopSend={handleStopSend}
          sessionId={sessionId}
          sessions={sessions}
          chatModes={chatModes}
          llmModels={llmModels}
        />
      </div>
    )
  }

  // ── Cursor-style UI (default) ────────────────────────────────────────────────
  return (
    <>
      <div className="flex h-full flex-col bg-[#0B0F14] relative">
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          <ResizablePanel defaultSize={65} minSize={40} order={1}>
            <DataPreviewPanel />
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-white/[0.06] hover:bg-[#22d3ee]/20 transition-colors data-[resize-handle-active]:bg-[#22d3ee]/30" />

          <ResizablePanel
            ref={chatPanelRef}
            defaultSize={35}
            minSize={25}
            maxSize={50}
            collapsible
            collapsedSize={0}
            onCollapse={() => dispatch(setChatPanelOpen(false))}
            onExpand={() => dispatch(setChatPanelOpen(true))}
            order={2}
          >
            <ChatPanel
              onSendMessage={handleSendMessage}
              disabled={isLoading}
              onStopSend={handleStopSend}
              sessionId={sessionId}
              sessions={sessions}
              chatModes={chatModes}
              llmModels={llmModels}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  )
}
