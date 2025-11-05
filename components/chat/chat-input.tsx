"use client"

import type React from "react"
import { useState } from "react"
import { useDispatch } from "react-redux"
import { addMessage, startNewConversation } from "@/lib/features/chat/chat-slice"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, Send } from "lucide-react"
import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import type { RootState } from "@/lib/store"
import { apiClient } from "@/lib/api/client"

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
      timestamp: new Date(),
    }

    dispatch(addMessage(userMessage))
    const userInput = input
    setInput("")

    // Call the actual chat API
    try {
      const response = await apiClient.chat({
        message: userInput,
        conversation_history: [], // TODO: Add actual conversation history from Redux
      })

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        role: "assistant" as const,
        timestamp: new Date(),
      }
      dispatch(addMessage(aiMessage))
    } catch (error) {
      console.error('Chat API error:', error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        role: "assistant" as const,
        timestamp: new Date(),
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
    <div className="border-t border-gray-200 px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Finto..."
            className="min-h-[60px] max-h-[200px] pr-20 resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />

          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
              <Paperclip className="h-4 w-4 text-gray-500" />
            </Button>

            <Button
              type="submit"
              disabled={!input.trim()}
              size="sm"
              className="h-8 w-8 p-0 bg-black hover:bg-gray-800 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
