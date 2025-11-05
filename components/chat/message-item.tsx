"use client"

import type { Message } from "@/lib/features/chat/chat-slice"
import { User, Bot, Copy, ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MessageItemProps {
  message: Message
}

export default function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "user"

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
  }

  return (
    <div className={cn("flex gap-4", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}

      <div className={cn("flex-1 max-w-2xl", isUser && "flex justify-end")}>
        <div
          className={cn("px-4 py-3 rounded-lg", isUser ? "bg-blue-500 text-white ml-12" : "bg-gray-100 text-gray-900")}
        >
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>

          {!isUser && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700">
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700">
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  )
}
