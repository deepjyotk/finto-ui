"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { C1Component, ThemeProvider } from "@thesysai/genui-sdk"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
}

export type C1ActionEvent = {
  type?: string
  params?: Record<string, any>
  humanFriendlyMessage?: string
  llmFriendlyMessage?: string
}

interface ChatDisplayProps {
  messages: ChatMessage[]
  onAction?: (action: C1ActionEvent) => void
}

const thesysDarkTheme = {
  chatContainerBg: "transparent",
  chatAssistantResponseBg: "transparent",
  chatAssistantResponseText: "var(--color-foreground)",
  chatUserResponseBg: "var(--color-secondary)",
  chatUserResponseText: "var(--color-secondary-foreground)",
  interactiveAccent: "var(--color-secondary)",
  interactiveAccentHover: "var(--color-secondary-hover)",
  interactiveAccentPressed: "var(--color-secondary-pressed)",
  interactiveAccentDisabled: "var(--color-secondary-disabled)",
}

export default function ChatDisplay({ messages, onAction }: ChatDisplayProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <h1 className="mb-2 text-4xl font-semibold text-[var(--color-foreground)]">
              How can I help you today?
            </h1>
            <p className="text-gray-400">Start a conversation by typing a message below.</p>
          </div>
        </div>
      ) : (
        <ThemeProvider mode="dark" theme={thesysDarkTheme} darkTheme={thesysDarkTheme}>
          <div className="mx-auto max-w-3xl px-4 py-8">
            {messages.map((message) => {
              return (
                <div
                  key={message.id}
                  className={cn(
                    "group mb-6 flex gap-4",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" ? (
                    // comment below div
                     <div className="-mx-4 -my-3 w-full rounded-xl border border-white/5 bg-[var(--chat-surface)]/90 p-4 shadow-lg backdrop-blur">
                      <C1Component
                        c1Response={message.content}
                        isStreaming={message.isStreaming || false}
                        onAction={onAction}
                      />
                      {message.isStreaming && (
                        <div className="px-1 pt-3">
                          <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-gray-400" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="max-w-[85%] rounded-lg bg-[var(--color-secondary)] px-4 py-3 text-[var(--color-secondary-foreground)] shadow-md">
                      <div className="whitespace-pre-wrap break-words">{message.content}</div>
                      {message.isStreaming && (
                        <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-gray-400" />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        </ThemeProvider>
      )}
    </div>
  )
}
