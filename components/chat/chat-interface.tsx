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

import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { C1Chat } from "@thesysai/genui-sdk";
import "@crayonai/react-ui/styles/index.css";
import { themePresets } from "@crayonai/react-ui";

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
  // Use authenticated user info to personalize the agent name
  const { user } = useSelector((state: RootState) => state.auth);

  const agentName = useMemo(
    () =>
      user?.full_name
        ? `${user.full_name.split(" ")[0]}'s Copilot`
        : "Finto AI",
    [user?.full_name]
  );

  // Using the sessionId as a React key so that changing session
  // remounts C1Chat and resets its internal state for that thread.
  const chatKey = useMemo(
    () =>
      sessionId && sessionId.length > 0
        ? sessionId
        : isNewChat
        ? "new-chat"
        : "chat-default",
    [sessionId, isNewChat]
  );

  // Create a custom API URL that includes session management
  const apiUrl = useMemo(() => {
    // We'll use a query parameter to pass session info
    const params = new URLSearchParams();
    if (sessionId) {
      params.set("session_id", sessionId);
    }
    if (isNewChat && !sessionId) {
      params.set("new_chat", "true");
    }
    return `/api/thesys/chat${params.toString() ? `?${params.toString()}` : ""}`;
  }, [isNewChat, sessionId]);

  return (
    <div className="chat-shell flex min-h-[calc(100vh-64px)] flex-1 flex-col bg-[#050509]">
      <C1Chat
        key={chatKey}
        // Next.js API route that proxies to FastAPI /api/v1/thesys/chat
        // Handles SSE streaming for real-time responses and session management
        // Session ID is passed via URL parameter; API route creates session if missing
        apiUrl={apiUrl}
        // Full-page layout for immersive chat experience
        formFactor="full-page"
        // Dark theme using Candy preset from Crayon UI
        theme={{ ...themePresets.candy, mode: "dark" }}
        // Personalized agent branding
        agentName={agentName}
        logoUrl="/logo-brokerbuddy.svg"
        // Auto-scroll behavior for streaming messages
        scrollVariant="always"
      />
    </div>
  );
}
