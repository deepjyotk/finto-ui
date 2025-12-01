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

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { apiClient } from "@/lib/api/client";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Use authenticated user info to personalize the agent name
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId ?? null);
  const [chatKey, setChatKey] = useState<string>(() => {
    if (sessionId) return sessionId;
    if (isNewChat) return "new-chat";
    return "chat-default";
  });
  const [newChatMode, setNewChatMode] = useState<boolean>(isNewChat && !sessionId);
  const creatingSessionRef = useRef<Promise<string> | null>(null);
  const hasReportedSessionRef = useRef<boolean>(Boolean(sessionId));
  const previousSessionIdRef = useRef<string | null>(sessionId ?? null);
  const previousIsNewChatRef = useRef<boolean>(isNewChat);

  const agentName = useMemo(
    () =>
      user?.full_name
        ? `${user.full_name.split(" ")[0]}'s Copilot`
        : "Finto AI",
    [user?.full_name]
  );

  // Keep local session state in sync when user switches sessions from outside
  useEffect(() => {
    const incomingSessionId = sessionId ?? null;
    const previousSessionId = previousSessionIdRef.current;
    const previousIsNewChat = previousIsNewChatRef.current;

    const sessionChanged = incomingSessionId !== previousSessionId;
    const newChatFlagChanged = isNewChat !== previousIsNewChat;

    if (sessionChanged && incomingSessionId && incomingSessionId !== activeSessionId) {
      setActiveSessionId(incomingSessionId);
      setNewChatMode(false);
      setChatKey(incomingSessionId);
      hasReportedSessionRef.current = true;
      creatingSessionRef.current = null;
    } else if ((sessionChanged || newChatFlagChanged) && isNewChat && !incomingSessionId) {
      // Explicitly starting a fresh chat from outside
      setActiveSessionId(null);
      setNewChatMode(true);
      setChatKey("new-chat");
      hasReportedSessionRef.current = false;
      creatingSessionRef.current = null;
    }

    previousSessionIdRef.current = incomingSessionId;
    previousIsNewChatRef.current = isNewChat;
  }, [sessionId, isNewChat]);

  const updateQueryParamWithSession = useCallback(
    (newSessionId: string) => {
      try {
        const params = new URLSearchParams(searchParams?.toString() ?? "");
        params.set("session", newSessionId);
        params.delete("new");

        const query = params.toString();
        const nextPath = query ? `${pathname}?${query}` : pathname;
        router.replace(nextPath);
      } catch (error) {
        console.error("Failed to update session in query params:", error);
      }
    },
    [pathname, router, searchParams]
  );

  const notifySessionCreated = useCallback(
    (newSessionId: string) => {
      if (hasReportedSessionRef.current) return;
      hasReportedSessionRef.current = true;

      updateQueryParamWithSession(newSessionId);
      onSessionCreated?.(newSessionId);
    },
    [onSessionCreated, updateQueryParamWithSession]
  );

  const ensureSessionId = useCallback(async (): Promise<string> => {
    if (activeSessionId) {
      return activeSessionId;
    }

    if (creatingSessionRef.current) {
      return creatingSessionRef.current;
    }

    const creationPromise = (async () => {
      const response = await apiClient.createChatSession();
      const newSessionId = response.session_id;

      if (!newSessionId) {
        throw new Error("Session creation did not return a session_id");
      }

      setActiveSessionId(newSessionId);
      setNewChatMode(false);
      notifySessionCreated(newSessionId);

      return newSessionId;
    })();

    creatingSessionRef.current = creationPromise;

    try {
      return await creationPromise;
    } finally {
      creatingSessionRef.current = null;
    }
  }, [activeSessionId, notifySessionCreated]);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (activeSessionId) {
      params.set("session_id", activeSessionId);
    } else if (newChatMode) {
      params.set("new_chat", "true");
    }

    const query = params.toString();
    return `/api/thesys/chat${query ? `?${query}` : ""}`;
  }, [activeSessionId, newChatMode]);

  const processMessage = useCallback(
    async ({ messages, abortController }: { messages: { role: "user" | "assistant"; content: string }[]; abortController: AbortController }) => {
      const sessionToUse = await ensureSessionId();
      const userMessage = [...messages].reverse().find((message) => message.role === "user");

      const urlParams = new URLSearchParams({ session_id: sessionToUse });
      const url = `/api/thesys/chat?${urlParams.toString()}`;

      return fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message_payload: {
            content: userMessage?.content ?? "",
          },
          session_id: sessionToUse,
        }),
        signal: abortController.signal,
      });
    },
    [ensureSessionId]
  );

  // Keep the key in state so explicit session switches remount C1Chat,
  // but adding a session_id mid-chat (after creation) does not wipe messages.

  return (
    <div className="chat-shell flex min-h-[calc(100vh-64px)] flex-1 flex-col bg-[#050509]">
      <C1Chat
        key={chatKey}
        processMessage={processMessage}
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
