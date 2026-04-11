"use client"

import { useRef, useEffect, useCallback } from "react"
import { useDispatch } from "react-redux"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AppDispatch } from "@/lib/store"
import type { ChatModeItem, LLMModelItem, SessionItem } from "@/features/chat/apis/chat-api"
import { setChatPanelOpen, startNewChat, deleteChatSession, getSessionDisplayTitle } from "@/features/chat/redux"
import ChatDisplay from "./chat-display"
import UserTextEnter from "./user-text-enter"
import { FEATURE_FLAGS } from "@/lib/feature-flags"

interface ChatPanelProps {
  onSendMessage: (message: string, modelId: string) => Promise<void>
  disabled: boolean
  onStopSend?: () => void
  sessionId: string | null
  sessions: SessionItem[]
  chatModes: ChatModeItem[]
  llmModels: LLMModelItem[]
}

export default function ChatPanel({
  onSendMessage,
  disabled,
  onStopSend,
  sessionId,
  sessions,
  chatModes,
  llmModels,
}: ChatPanelProps) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const tabsRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    }
  }, [sessionId])

  const handleNewChat = useCallback(() => {
    dispatch(startNewChat({ router }))
  }, [dispatch, router])

  const handleSwitchSession = useCallback(
    (targetSessionId: string) => {
      if (targetSessionId !== sessionId) {
        router.push(`/chat/${targetSessionId}`)
      }
    },
    [router, sessionId],
  )

  const handleCloseTab = useCallback(
    (e: React.MouseEvent, targetSessionId: string) => {
      e.stopPropagation()
      dispatch(deleteChatSession({ sessionId: targetSessionId, activeSessionId: sessionId, router }))
    },
    [dispatch, sessionId, router],
  )

  // ── Old / classic UI: no tab bar, full-width chat ──────────────────────────
  if (!FEATURE_FLAGS.CURSOR_STYLE_UI_ENABLED) {
    return (
      <div className="flex h-full flex-col bg-[var(--chat-surface)] text-[var(--color-foreground)]">
        {/* ChatDisplay owns the overflow-y-auto container — keeping it full-width
            puts the scrollbar at the very right edge of the screen. Content
            centering (max-w-3xl) is applied inside ChatDisplay itself. */}
        <ChatDisplay centerContent />
        {/* Centre the input row the same way so it aligns with the messages. */}
        <div className="w-full max-w-3xl mx-auto shrink-0">
          <UserTextEnter
            onSendMessage={onSendMessage}
            disabled={disabled}
            onStopSend={onStopSend}
            sessionId={sessionId}
            chatModes={chatModes}
            llmModels={llmModels}
          />
        </div>
      </div>
    )
  }

  // ── Cursor-style UI: tab bar + chat ─────────────────────────────────────────
  return (
    <div className="flex h-full flex-col bg-[var(--chat-surface)] text-[var(--color-foreground)]">
      {/* Tab bar */}
      <div className="flex items-center border-b border-white/[0.08] shrink-0 bg-[#0d1017]">
        <div
          ref={tabsRef}
          className="flex flex-1 items-center overflow-x-auto scrollbar-none"
        >
          {sessions.slice(0, 5).map((s) => {
            const isActive = s.session_id === sessionId
            return (
              <button
                key={s.session_id}
                ref={isActive ? activeTabRef : undefined}
                type="button"
                onClick={() => handleSwitchSession(s.session_id)}
                className={`group relative flex shrink-0 items-center gap-1.5 border-r border-white/[0.06] px-3 py-2 text-[12px] font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--chat-surface)] text-white/90"
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white/60"
                }`}
              >
                {isActive && (
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-[#22d3ee]" />
                )}
                <span className="max-w-[100px] truncate" title={getSessionDisplayTitle(s)}>
                  {getSessionDisplayTitle(s, 28)}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleCloseTab(e, s.session_id)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCloseTab(e as unknown as React.MouseEvent, s.session_id) }}
                  className="ml-0.5 flex h-4 w-4 items-center justify-center rounded opacity-0 transition-opacity hover:bg-white/[0.1] group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </span>
              </button>
            )
          })}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-0.5 px-1.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewChat}
            className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/[0.08]"
            title="New chat"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch(setChatPanelOpen(false))}
            className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/[0.08]"
            title="Close panel"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ChatDisplay />

      <UserTextEnter
        onSendMessage={onSendMessage}
        disabled={disabled}
        onStopSend={onStopSend}
        sessionId={sessionId}
        chatModes={chatModes}
        llmModels={llmModels}
      />
    </div>
  )
}
