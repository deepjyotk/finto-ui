"use client"

import { useDispatch } from "react-redux"
import { MessageSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AppDispatch } from "@/lib/store"
import { setChatPanelOpen } from "@/features/chat/redux"
import ChatDisplay from "./chat-display"
import UserTextEnter from "./user-text-enter"

interface ChatPanelProps {
  onSendMessage: (message: string) => Promise<void>
  disabled: boolean
  sessionId: string | null
}

export default function ChatPanel({
  onSendMessage,
  disabled,
  sessionId,
}: ChatPanelProps) {
  const dispatch = useDispatch<AppDispatch>()

  return (
    <div className="flex h-full flex-col bg-[var(--chat-surface)] text-[var(--color-foreground)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#22d3ee]" />
          <span className="text-sm font-semibold text-white">AI Assistant</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => dispatch(setChatPanelOpen(false))}
          className="h-7 w-7 text-gray-400 hover:text-white hover:bg-white/10"
          aria-label="Close chat panel"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ChatDisplay />

      <UserTextEnter
        onSendMessage={onSendMessage}
        disabled={disabled}
        sessionId={sessionId}
      />
    </div>
  )
}
