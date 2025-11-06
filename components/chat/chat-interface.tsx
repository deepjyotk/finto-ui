"use client"

import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import MessageList from "./message-list"
import ChatInput from "./chat-input"
import WelcomeScreen from "./welcome-screen"

export default function ChatInterface() {
  const { messages, isLoading } = useSelector((state: RootState) => state.chat)

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#343541]">
      {/* Scrollable messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
      </div>
      
      {/* Fixed input at bottom */}
      <div className="flex-shrink-0">
        <ChatInput />
      </div>
    </div>
  )
}
