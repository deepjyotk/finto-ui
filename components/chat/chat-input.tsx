"use client"

/**
 * @deprecated This component is legacy code.
 * 
 * The chat interface now uses the Thesys C1Chat component from @thesysai/genui-sdk
 * which handles its own input, message rendering, and streaming internally.
 * 
 * This component is kept for reference or potential custom implementations
 * that don't use the C1Chat component (e.g., using @crayonai/react-ui/Shell directly).
 * 
 * See: components/chat/chat-interface.tsx for the active implementation
 */

import type React from "react"
import { useState } from "react"
import { useDispatch } from "react-redux"
import { addMessage, startNewConversation } from "@/lib/slices/chat"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import type { RootState } from "@/lib/store"

/** @deprecated Use C1Chat component instead */
export default function ChatInput() {
  const dispatch = useDispatch()
  const router = useRouter()
  const { currentConversationId } = useSelector((state: RootState) => state.chat)
  const [input, setInput] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // If no current conversation, start a new one
    if (!currentConversationId) {
      dispatch(startNewConversation())
    }

    const userMessage = {
      id: Date.now().toString(),
      content: input,
      role: "user" as const,
      timestamp: new Date().toISOString(),
    }

    dispatch(addMessage(userMessage))
    const userInput = input
    setInput("")

    // Call the actual chat API
    try {
      // This is deprecated - use C1Chat component with /api/v1/thesys/chat instead
      throw new Error("This chat input is deprecated. Use C1Chat component with /api/v1/thesys/chat endpoint.")
    } catch (error) {
      console.error('Chat API error:', error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        role: "assistant" as const,
        timestamp: new Date().toISOString(),
      }
      dispatch(addMessage(errorMessage))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="border-t border-white/10 bg-[#343541] px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything"
            className="min-h-[52px] max-h-[200px] pr-12 py-3 px-4 resize-none bg-[#40414f] border-none text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 shadow-lg text-[15px] leading-6 rounded-lg"
          />

          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <Button
              type="submit"
              disabled={!input.trim()}
              size="sm"
              className="h-8 w-8 p-0 bg-white/10 hover:bg-white/20 text-white rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
        <p className="text-center text-xs text-gray-500 mt-2">
          ChatGPT can make mistakes. Check important info.
        </p>
      </div>
    </div>
  )
}
