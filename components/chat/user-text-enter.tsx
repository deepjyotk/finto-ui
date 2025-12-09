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
    <div className="border-t border-white/10 bg-[#343541]">
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="relative flex items-end gap-2 rounded-lg border border-white/20 bg-[#40414f] p-2 shadow-lg">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI..."
            disabled={disabled || !sessionId}
            className="min-h-[52px] max-h-[200px] resize-none border-0 bg-transparent text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || disabled || !sessionId}
            size="icon"
            className="h-9 w-9 shrink-0 bg-[#10a37f] text-white hover:bg-[#0d8f6e] disabled:opacity-50"
          >
            {disabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {sessionId && (
          <div className="mt-2 text-center text-xs text-gray-500">
            Session ID: <span className="font-mono">{sessionId}</span>
          </div>
        )}
      </div>
    </div>
  )
}

