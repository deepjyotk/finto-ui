"use client"

import { useEffect, useRef } from "react"
import type { Message } from "@/lib/features/chat/chat-slice"
import MessageItem from "./message-item"
import { Loader2 } from "lucide-react"

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="h-full">
      <div className="w-full">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="w-full text-white border-b border-black/10 bg-[#444654]">
            <div className="flex gap-6 p-4 md:py-6 md:px-6 max-w-3xl mx-auto">
              <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-[#19c37d] flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              </div>
              <span className="text-gray-400">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
