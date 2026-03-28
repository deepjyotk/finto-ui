import { createAsyncThunk } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/lib/store"
import type { ChatMessage } from "./chat.types"
import type { InitializeChatArgs, InitializeChatPayload } from "./chat.types"
import type { SessionItem } from "./chat.types"
import { normalizeApiMessages } from "./chat.helpers"
import {
  createChatSession,
  getSessionMessages,
  sendChatMessage,
  getSessions,
  deleteSession,
} from "@/features/chat/apis/chat-api"
import { signOut, logout } from "@/features/auth/redux"
import {
  addMessage,
  updateMessage,
  setIsLoading,
  setIsSubmittingApproval,
  setChatSidebarOpen,
  toggleChatSidebarCollapsed as toggleChatSidebarCollapsedAction,
} from "./chat.slice"

/* ---------- Async Thunks ---------- */
export const initializeChatSession = createAsyncThunk<
  InitializeChatPayload,
  InitializeChatArgs,
  { state: RootState; dispatch: AppDispatch }
>(
  "chat/initializeSession",
  async (
    { paramsSessionId, searchParamsKey, initialMessages, initialSessionId, router },
    { getState }
  ) => {
    const paramsSessionIdRaw = Array.isArray(paramsSessionId) ? paramsSessionId[0] : paramsSessionId
    const urlSearchParams = new URLSearchParams(searchParamsKey || "")
    const searchSessionId = urlSearchParams.get("session_id") || urlSearchParams.get("sessionId")
    const normalizedSessionId = (paramsSessionIdRaw || searchSessionId || "").trim()
    const isNewChat = !normalizedSessionId || normalizedSessionId.toLowerCase() === "new"

    if (isNewChat) {
      const response = await createChatSession()
      const newSessionId = response.session_id
      router.replace(`/chat/${newSessionId}`)
      return {
        sessionId: newSessionId,
        messages: [],
        resolvedKey: newSessionId,
      }
    }

    const resolvedKey = normalizedSessionId

    const hasPrefetchedSession =
      !!initialSessionId &&
      !!normalizedSessionId &&
      normalizedSessionId === initialSessionId &&
      initialMessages !== undefined

    if (hasPrefetchedSession) {
      return {
        sessionId: initialSessionId,
        messages: initialMessages ?? [],
        resolvedKey,
      }
    }

    const sessionData = await getSessionMessages(normalizedSessionId)
    const messages = sessionData?.messages ? normalizeApiMessages(sessionData.messages) : []

    return {
      sessionId: normalizedSessionId,
      messages,
      resolvedKey,
    }
  },
  {
    condition: ({ paramsSessionId, searchParamsKey }, { getState }) => {
      const state = getState() as RootState
      const paramsSessionIdRaw = Array.isArray(paramsSessionId) ? paramsSessionId[0] : paramsSessionId
      const urlSearchParams = new URLSearchParams(searchParamsKey || "")
      const searchSessionId = urlSearchParams.get("session_id") || urlSearchParams.get("sessionId")
      const normalizedSessionId = (paramsSessionIdRaw || searchSessionId || "").trim()
      const isNewChat = !normalizedSessionId || normalizedSessionId.toLowerCase() === "new"
      const resolvedKey = isNewChat ? "new" : normalizedSessionId

      return state.chat.lastResolvedSessionKey !== resolvedKey
    },
  }
)

export const sendMessage = createAsyncThunk<
  void,
  { content: string },
  { state: RootState; dispatch: AppDispatch }
>("chat/sendMessage", async ({ content }, { getState, dispatch }) => {
  const trimmed = content.trim()
  const { sessionId, isLoading, selectedBrokerId } = getState().chat
  if (!trimmed || isLoading || !sessionId) return

  const userMessage: ChatMessage = {
    id: `user-${Date.now()}`,
    role: "user",
    content: trimmed,
  }

  dispatch(addMessage(userMessage))
  dispatch(setIsLoading(true))

  const assistantMessageId = `assistant-${Date.now()}`
  dispatch(
    addMessage({
      id: assistantMessageId,
      role: "assistant",
      content: "",
      isStreaming: true,
    })
  )

  try {
    let accumulatedContent = ""

    await sendChatMessage({
      content: userMessage.content,
      sessionId,
      brokerId: selectedBrokerId || "",
      onChunk: (chunk) => {
        accumulatedContent += chunk
        dispatch(
          updateMessage({
            id: assistantMessageId,
            changes: { content: accumulatedContent, isStreaming: true },
          })
        )
      },
      onComplete: (fullContent) => {
        dispatch(
          updateMessage({
            id: assistantMessageId,
            changes: { content: fullContent, isStreaming: false },
          })
        )
      },
      onError: () => {
        dispatch(
          updateMessage({
            id: assistantMessageId,
            changes: {
              content: "Sorry, an error occurred. Please try again.",
              isStreaming: false,
            },
          })
        )
      },
    })
  } catch (error) {
    dispatch(
      updateMessage({
        id: assistantMessageId,
        changes: {
          content: "Sorry, an error occurred. Please try again.",
          isStreaming: false,
        },
      })
    )
  } finally {
    dispatch(setIsLoading(false))
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("credits-updated"))
    }
  }
})

export const loadChatSessions = createAsyncThunk<SessionItem[]>(
  "chat/loadSessions",
  async () => {
    const response = await getSessions()
    return response.sessions ?? []
  }
)

export const deleteChatSession = createAsyncThunk<
  SessionItem[],
  { sessionId: string; activeSessionId: string | null; router: { push: (path: string) => void } }
>("chat/deleteSession", async ({ sessionId, activeSessionId, router }) => {
  await deleteSession(sessionId)
  const response = await getSessions()
  const updatedSessions = response.sessions ?? []

  const wasActive = activeSessionId === sessionId
  if (wasActive) {
    if (updatedSessions.length > 0) {
      router.push(`/chat/${updatedSessions[0].session_id}`)
    } else {
      const newSession = await createChatSession()
      router.push(`/chat/${newSession.session_id}`)
    }
  }

  return updatedSessions
})

export const performLogout = createAsyncThunk<void, void, { dispatch: AppDispatch }>(
  "chat/performLogout",
  async (_arg, { dispatch }) => {
    try {
      const { success, error } = await signOut()
      if (success) {
        dispatch(logout())
        if (typeof window !== "undefined") {
          window.location.href = "/"
        }
      } else {
        console.error("Logout error:", error)
      }
    } catch (error) {
      console.error("Failed to logout:", error)
    }
  }
)

export const toggleChatSidebarOpen = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch; state: RootState }
>("chat/toggleChatSidebarOpen", async (_arg, { dispatch, getState }) => {
  const isOpen = getState().chat.sidebarOpen
  dispatch(setChatSidebarOpen(!isOpen))
})

export const toggleChatSidebarCollapsed = createAsyncThunk<void, void, { dispatch: AppDispatch }>(
  "chat/toggleChatSidebarCollapsed",
  async (_arg, { dispatch }) => {
    dispatch(toggleChatSidebarCollapsedAction())
  }
)

export const startNewChat = createAsyncThunk<
  void,
  { router: { push: (path: string) => void } },
  { dispatch: AppDispatch }
>("chat/startNewChat", async ({ router }, { dispatch }) => {
  const response = await createChatSession()
  const newSessionId = response.session_id
  router.push(`/chat/${newSessionId}`)
  dispatch(setChatSidebarOpen(false))
})
