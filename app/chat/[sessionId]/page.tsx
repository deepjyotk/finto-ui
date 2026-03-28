import { redirect } from "next/navigation"
import { fetchSessionMessages, fetchSessionsServer, fetchChatMetadataServer } from "@/lib/server/chat-sessions"
import ChatPageClient from "@/features/chat/components/chat-page-client"
import type { SessionItem, UserBrokerItem, ChatModeItem, LLMModelItem } from "@/features/chat/apis/chat-api"
import type { ChatMessage } from "@/features/chat/components/chat-display"

interface ChatSessionPageProps {
  params: Promise<{
    sessionId?: string
  }>
}

export default async function ChatSessionPage({ params }: ChatSessionPageProps) {
  const resolvedParams = await params
  const rawSessionId = resolvedParams?.sessionId?.trim() ?? ""
  const normalizedSessionId = rawSessionId.toLowerCase()

  if (!rawSessionId) {
    redirect("/chat/new")
  }

  let sessions: SessionItem[] = []
  let brokers: UserBrokerItem[] = []
  let chatModes: ChatModeItem[] = []
  let llmModels: LLMModelItem[] = []
  let initialMessages: ChatMessage[] | undefined
  const isNewSession = normalizedSessionId === "new"

  try {
    const [sessionsResult, chatMetadataResult] = await Promise.all([
      fetchSessionsServer(),
      fetchChatMetadataServer(),
    ])
    sessions = sessionsResult
    brokers = chatMetadataResult.brokers ?? []
    chatModes = chatMetadataResult.chat_modes ?? []
    llmModels = chatMetadataResult.llm_models ?? []
  } catch (error) {
    console.error("Error in ChatSessionPage:", error)
  }

  try {
    if (!isNewSession) {
      const sessionResponse = await fetchSessionMessages(rawSessionId)
      const apiMessages = sessionResponse?.messages ?? []
      initialMessages = apiMessages.map((msg) => ({
        id: msg.id || `msg-${msg.seq_no}`,
        role: (msg.message_type || "").toLowerCase() === "ai" ? "assistant" : "user",
        content: msg.message_payload || "",
      }))
    }
  } catch (error) {
    console.error("Error loading session messages:", error)
    initialMessages = undefined
  }

  return (
    <ChatPageClient
      initialSessions={sessions}
      initialMessages={initialMessages}
      initialSessionId={isNewSession ? null : rawSessionId}
      brokers={brokers}
      chatModes={chatModes}
      llmModels={llmModels}
    />
  )
}
