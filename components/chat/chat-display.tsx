"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { C1Component, ThemeProvider } from "@thesysai/genui-sdk"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"


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
const isThesysEnabled =
  (process.env.NEXT_PUBLIC_THESYS_ENABLED ?? "true").toLowerCase() === "true"

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

function AssistantShimmerBubble() {
  return (
    <div
      className="-mx-4 -my-3 w-full rounded-xl border border-white/5 bg-[var(--chat-surface)]/90 p-4 shadow-lg backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[rgba(255,255,255,0.03)] p-4 shadow-inner">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(0,63,122,0.22), transparent 45%), radial-gradient(circle at 85% 10%, rgba(255,255,255,0.12), transparent 40%)",
          }}
        />
        <div className="relative space-y-3">
          <div className="flex items-center gap-3">
            <div className="shimmer h-3 w-10 rounded-full bg-white/10" />
            <div className="shimmer h-3 w-16 rounded-full bg-white/10" />
          </div>
          <div className="shimmer h-3 w-full rounded-full bg-white/10" />
          <div className="shimmer h-3 w-11/12 rounded-full bg-white/10" />
          <div className="shimmer h-3 w-5/6 rounded-full bg-white/10" />
          <div className="shimmer h-20 w-full rounded-lg bg-white/10" />
          <div className="flex items-center gap-2 pt-1 text-xs text-gray-400/90">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-secondary)]" />
            <span>Generating a response...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatDisplay({ messages, onAction }: ChatDisplayProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const chatContent = (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {messages.map((message) => {
        const messageContent = message.content || ""
        const isAssistant = message.role === "assistant"
        const showAssistantShimmer =
          isAssistant && message.isStreaming && messageContent.trim().length === 0

        return (
          <div
            key={message.id}
            className={cn(
              "group mb-6 flex gap-4",
              isAssistant ? "justify-start" : "justify-end"
            )}
          >
            {isAssistant ? (
              showAssistantShimmer ? (
                <AssistantShimmerBubble />
              ) : (
                <div className="-mx-4 -my-3 w-full rounded-xl bg-[var(--chat-surface)]/90 p-4 shadow-lg backdrop-blur">
                  {isThesysEnabled ? (
                    <>
                      <div className="prose prose-invert prose-sm max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-p:text-gray-200 prose-a:text-blue-400 prose-strong:text-white prose-table:text-sm">
                        <C1Component
                          c1Response={messageContent}
                          isStreaming={message.isStreaming || false}
                          onAction={onAction}
                        />
                      </div>
                      {message.isStreaming && (
                        <div className="flex items-center gap-2 px-1 pt-3 text-xs text-gray-400">
                          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-secondary)]" />
                          <span className="tracking-wide">Streaming response</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="prose prose-invert prose-sm max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-p:text-gray-200 prose-a:text-blue-400 prose-strong:text-white prose-table:text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {messageContent}
                        </ReactMarkdown>
                      </div>
                      {message.isStreaming && (
                        <div className="flex items-center gap-2 px-1 pt-3 text-xs text-gray-400">
                          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-secondary)]" />
                          <span className="tracking-wide">Streaming response</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
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
  )

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
        isThesysEnabled ? (
          <ThemeProvider mode="dark" theme={thesysDarkTheme} darkTheme={thesysDarkTheme}>
            {chatContent}
          </ThemeProvider>
        ) : (
          chatContent
        )
      )}
    </div>
  )
}
