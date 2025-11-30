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
 * Backend API: /api/thesys/chat (proxied via Next.js API route to FastAPI)
 *
 * C1ChatRequest schema:
 * - prompt: { role: "user"|"assistant"|"system"|"tool", content: string, id?: string }
 * - threadId: string (conversation ID)
 * - responseId: string (unique response ID)
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
  conversationId?: string;
};

export default function ChatInterface({ conversationId }: ChatInterfaceProps) {
  // Use authenticated user info to personalize the agent name
  const { user } = useSelector((state: RootState) => state.auth);

  const agentName = useMemo(
    () =>
      user?.full_name
        ? `${user.full_name.split(" ")[0]}'s Copilot`
        : "Finto AI",
    [user?.full_name]
  );

  // Using the conversationId as a React key so that changing URL / id
  // remounts C1Chat and resets its internal state for that thread.
  const chatKey = useMemo(
    () =>
      conversationId && conversationId.length > 0
        ? conversationId
        : "chat-default",
    [conversationId]
  );

  return (
    <div className="chat-shell flex min-h-[calc(100vh-64px)] flex-1 flex-col bg-[#050509]">
      <C1Chat
        key={chatKey}
        // Next.js API route that proxies to FastAPI /api/thesys/chat
        // Handles SSE streaming for real-time responses
        apiUrl="/api/thesys/chat"
        // Full-page layout for immersive chat experience
        formFactor="full-page"
        // Dark theme using Candy preset from Crayon UI
        theme={{ ...themePresets.candy, mode: "dark" }}
        // Personalized agent branding
        agentName={agentName}
        logoUrl="/logo-brokerbuddy.svg"
        // Auto-scroll behavior for streaming messages
        scrollVariant="always"
        // Handle custom actions from generative UI if needed
        // (C1Chat handles built-in actions like continue_conversation, open_url)
        // onAction={(event) => {
        //   switch (event.type) {
        //     case "download_report":
        //       // Custom action handling
        //       break;
        //     default:
        //       break;
        //   }
        // }}
      />
      <style jsx global>{`
        /* Hide the Shell sidebar to remove the redundant left drawer */
        .chat-shell .crayon-shell-sidebar-container,
        .chat-shell .crayon-shell-sidebar-container__overlay {
          display: none !important;
        }

        /* Let the chat fill the freed-up space */
        .chat-shell .crayon-shell-container {
          padding: 0;
        }
      `}</style>
    </div>
  );
}
