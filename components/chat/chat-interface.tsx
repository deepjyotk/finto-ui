"use client"

import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import MessageList from "./message-list"
import ChatInput from "./chat-input"

export default function ChatInterface() {
  const { messages, isLoading } = useSelector((state: RootState) => state.chat)

  return (
    <div className="flex-1 flex flex-col h-full">
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput />
    </div>
  )
}
