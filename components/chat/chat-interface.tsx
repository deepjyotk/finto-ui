"use client";

/**
 * Chat Interface Component
 *
 * This component wraps the Thesys C1Chat component from @thesysai/genui-sdk
 * which provides a full-featured chat interface with:
 * - Streaming SSE responses from the backend
 * - Rich generative UI components
 * - Dark theme support
 * - Conversation threading
 *
 * Backend API: /api/thesys/chat (proxied via Next.js API route to FastAPI /api/v1/thesys/chat)
 *
 * C1ChatRequest schema:
 * - message_payload: { content: string }
 * - session_id: string
 *
 * The C1Chat component handles:
 * - User input
 * - Message rendering with rich UI
 * - Streaming responses
 * - Conversation history
 */

import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { C1Chat } from "@thesysai/genui-sdk";
import "@crayonai/react-ui/styles/index.css";
import { buildChatTheme } from "./chat-theme";
import { sanitizeResponseStream, stripEmojis } from "./chat-utils";
import { useChatSession } from "./use-chat-session";

type ChatInterfaceProps = {
  sessionId?: string | null;
  isNewChat?: boolean;
  onSessionCreated?: (sessionId: string) => void;
};

export default function ChatInterface({
  sessionId,
  isNewChat = false,
  onSessionCreated,
}: ChatInterfaceProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    activeSessionId,
    apiUrl,
    chatKey,
    ensureSessionId,
    newChatInstanceRef,
    newChatMode,
  } = useChatSession({ sessionId, isNewChat, onSessionCreated });

  const agentName = useMemo(
    () => (user?.full_name ? `${user.full_name.split(" ")[0]}'s Copilot` : "Finto AI"),
    [user?.full_name]
  );

  const chatTheme = useMemo(buildChatTheme, []);

  const processMessage = useCallback(
    async ({ messages, abortController }: { messages: { role: "user" | "assistant"; content: string }[]; abortController: AbortController }) => {
      const sessionToUse = await ensureSessionId();
      const userMessage = [...messages].reverse().find((message) => message.role === "user");

      const urlParams = new URLSearchParams({ session_id: sessionToUse });
      // Preserve the new_chat_instance param to keep the cache key stable for the active chat
      if (newChatInstanceRef.current && newChatMode && !activeSessionId) {
        urlParams.set("new_chat_instance", newChatInstanceRef.current);
      }
      const url = `/api/thesys/chat?${urlParams.toString()}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message_payload: {
            content: stripEmojis(userMessage?.content ?? ""),
          },
          session_id: sessionToUse,
        }),
        signal: abortController.signal,
      });

      return sanitizeResponseStream(response);
    },
    [activeSessionId, ensureSessionId, newChatInstanceRef, newChatMode, sanitizeResponseStream, stripEmojis]
  );

  // Keep the key in state so explicit session switches remount C1Chat,
  // but adding a session_id mid-chat (after creation) does not wipe messages.

  return (
    <div className="chat-shell flex min-h-[calc(100vh-64px)] flex-1 flex-col bg-chat-surface">
      <C1Chat
        key={chatKey}
        processMessage={processMessage}
        // Next.js API route that proxies to FastAPI /api/v1/thesys/chat
        // Handles SSE streaming for real-time responses and session management
        // Session ID is passed via URL parameter; API route creates session if missing
        apiUrl={apiUrl}
        // Full-page layout for immersive chat experience
        formFactor="full-page"
        // Dark theme using Candy preset from Crayon UI with brand overrides
        theme={chatTheme}
        // Personalized agent branding
        agentName={agentName}
        // logoUrl="/logo-brokerbuddy.svg"
        // Auto-scroll behavior for streaming messages
        scrollVariant="always"
      />
    </div>
  );
}
