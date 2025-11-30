"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/lib/store";
import {
  loadConversation,
  startNewConversation,
} from "@/lib/features/chat/chat-slice";
import ChatInterface from "@/components/chat/chat-interface";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const { conversations, currentConversationId } = useSelector(
    (state: RootState) => state.chat
  );

  const conversationId = params.id as string;

  // Keep your existing conversation selection logic (URL ↔ Redux)
  useEffect(() => {
    if (conversationId === "new") {
      // Only create a new conversation if we don't have a current one
      if (!currentConversationId) {
        dispatch(startNewConversation());
      }
    } else {
      const conversation = conversations.find((c) => c.id === conversationId);

      if (conversation && currentConversationId !== conversationId) {
        dispatch(loadConversation(conversationId));
      } else if (!conversation) {
        // Conversation doesn't exist, redirect to a "new" chat
        router.replace("/chat/new");
      }
    }
  }, [conversationId, currentConversationId, dispatch, conversations, router]);

  // Redirect `/chat/new` → `/chat/{realId}` once a new conversation is created
  useEffect(() => {
    if (
      conversationId === "new" &&
      currentConversationId &&
      currentConversationId !== "new"
    ) {
      router.replace(`/chat/${currentConversationId}`);
    }
  }, [conversationId, currentConversationId, router]);

  // For Thesys, we use the URL id (or the resolved currentConversationId) as a key
  // so that switching chats remounts the C1Chat instance cleanly.
  const effectiveConversationId =
    conversationId === "new"
      ? currentConversationId ?? "new"
      : conversationId;

  return <ChatInterface conversationId={effectiveConversationId} />;
}
