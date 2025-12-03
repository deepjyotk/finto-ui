"use client";

/**
 * @deprecated This component is legacy code.
 * 
 * The chat interface now uses the Thesys C1Chat component from @thesysai/genui-sdk
 * which handles message rendering and streaming internally with rich generative UI.
 * 
 * This component is kept for reference or potential custom implementations
 * that don't use the C1Chat component (e.g., using @crayonai/react-ui/Shell directly).
 * 
 * See: components/chat/chat-interface.tsx for the active implementation
 */

import React, { useEffect, useRef, useCallback } from "react";
import type { Message } from "@/lib/slices/chat";
import MessageItem from "./message-item";
import { Loader2 } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

/** @deprecated Use C1Chat component instead */
export default function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <div className="h-full">
      <div className="w-full">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="w-full border-b border-black/10 bg-[#444654] text-white">
            <div className="mx-auto flex max-w-3xl gap-4 p-4 md:px-6 md:py-6">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-sm bg-[#19c37d]">
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              </div>
              <span className="text-sm text-gray-300">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
