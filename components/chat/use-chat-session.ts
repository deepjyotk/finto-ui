"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createChatSession } from "@/lib/api/chat_api";

type UseChatSessionParams = {
  sessionId?: string | null;
  isNewChat: boolean;
  onSessionCreated?: (sessionId: string) => void;
};

export const useChatSession = ({
  sessionId,
  isNewChat,
  onSessionCreated,
}: UseChatSessionParams) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId ?? null);
  const [chatKey, setChatKey] = useState<string>(() => {
    if (sessionId) return sessionId;
    if (isNewChat) return `new-chat-${crypto.randomUUID()}`;
    return "chat-default";
  });
  const [newChatMode, setNewChatMode] = useState<boolean>(isNewChat && !sessionId);
  const creatingSessionRef = useRef<Promise<string> | null>(null);
  const hasReportedSessionRef = useRef<boolean>(Boolean(sessionId));
  const previousSessionIdRef = useRef<string | null>(sessionId ?? null);
  const previousIsNewChatRef = useRef<boolean>(isNewChat);
  const newChatInstanceRef = useRef<string | null>(isNewChat && !sessionId ? chatKey : null);

  // Keep local session state in sync when user switches sessions from outside
  useEffect(() => {
    const incomingSessionId = sessionId ?? null;
    const previousSessionId = previousSessionIdRef.current;
    const previousIsNewChat = previousIsNewChatRef.current;

    const sessionChanged = incomingSessionId !== previousSessionId;
    const newChatFlagChanged = isNewChat !== previousIsNewChat;
    const cameFromNewChatInstance = Boolean(newChatInstanceRef.current);

    if (sessionChanged && incomingSessionId) {
      if (cameFromNewChatInstance) {
        // Preserve the existing chat key so the first message stays visible after session creation.
        setActiveSessionId((current) => current ?? incomingSessionId);
        setNewChatMode(false);
        newChatInstanceRef.current = null;
        hasReportedSessionRef.current = true;
        creatingSessionRef.current = null;
      } else if (incomingSessionId !== activeSessionId) {
        setActiveSessionId(incomingSessionId);
        setNewChatMode(false);
        setChatKey(incomingSessionId);
        hasReportedSessionRef.current = true;
        creatingSessionRef.current = null;
      }
    } else if ((sessionChanged || newChatFlagChanged) && isNewChat && !incomingSessionId) {
      // Explicitly starting a fresh chat from outside
      const newInstanceKey = `new-chat-${crypto.randomUUID()}`;
      setActiveSessionId(null);
      setNewChatMode(true);
      setChatKey(newInstanceKey);
      newChatInstanceRef.current = newInstanceKey;
      hasReportedSessionRef.current = false;
      creatingSessionRef.current = null;
    }

    previousSessionIdRef.current = incomingSessionId;
    previousIsNewChatRef.current = isNewChat;
  }, [activeSessionId, isNewChat, sessionId]);

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
      const response = await createChatSession();
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
      if (newChatInstanceRef.current) {
        params.set("new_chat_instance", newChatInstanceRef.current);
      }
    }

    const query = params.toString();
    return `/api/thesys/chat${query ? `?${query}` : ""}`;
  }, [activeSessionId, newChatMode]);

  return {
    activeSessionId,
    apiUrl,
    chatKey,
    ensureSessionId,
    newChatInstanceRef,
    newChatMode,
  };
};
