"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2 } from "lucide-react"

interface UserTextEnterProps {
  onSendMessage: (message: string) => Promise<void>
  disabled?: boolean
  sessionId?: string | null
}

export default function UserTextEnter({
  onSendMessage,
  disabled = false,
  sessionId,
}: UserTextEnterProps) {
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  const handleSend = async () => {
    if (!input.trim() || disabled) return

    const message = input.trim()
    setInput("")
    await onSendMessage(message)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-white/5 bg-gradient-to-t from-[#1a1b23] via-[#1f2028] to-transparent backdrop-blur-sm">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="group relative flex items-end gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-[#2a2b35]/80 via-[#252630]/80 to-[#1f2028]/80 p-3 shadow-2xl backdrop-blur-xl transition-all duration-300 focus-within:border-white/20 focus-within:shadow-[0_0_30px_rgba(16,163,127,0.15)]">
          {/* Glow effect on focus */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-[#10a37f]/0 via-[#10a37f]/5 to-[#10a37f]/0 opacity-0 transition-opacity duration-300 focus-within:opacity-100" />
          
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI..."
            disabled={disabled || !sessionId}
            className="relative z-10 min-h-[56px] max-h-[200px] resize-none border-0 bg-transparent px-2 text-[15px] leading-6 text-white placeholder:text-gray-400/60 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || disabled || !sessionId}
            size="icon"
            className="relative z-10 h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-[#10a37f] to-[#0d8f6e] text-white shadow-lg shadow-[#10a37f]/20 transition-all duration-200 hover:scale-105 hover:bg-gradient-to-br hover:from-[#12b38a] hover:to-[#0fa37f] hover:shadow-xl hover:shadow-[#10a37f]/30 disabled:scale-100 disabled:opacity-40 disabled:shadow-none active:scale-95"
          >
            {disabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            )}
          </Button>
        </div>
        {sessionId && (
          <div className="mt-3 text-center text-xs text-gray-500/70">
            Session ID: <span className="font-mono text-gray-400/80">{sessionId}</span>
          </div>
        )}
      </div>
    </div>
  )
}

