import { apiClient } from "@/lib/api/client";

// Thesys C1Chat Types (from OpenAPI spec)
export interface C1Message {
  content: string;
}

export interface C1ChatRequest {
  message_payload: C1Message;
  session_id: string;
  broker_id: string;
}

// Chat Metadata Types (from OpenAPI spec)
export interface UserBrokerItem {
  broker_id: string;
  broker_name: string;
}

export interface ChatModeItem {
  id: string;
  label: string;
  description: string;
}

export interface LLMModelItem {
  id: string;
  label: string;
}

export interface ChatMetadataResponse {
  brokers: UserBrokerItem[];
  chat_modes: ChatModeItem[];
  llm_models: LLMModelItem[];
}

// Session Types (from OpenAPI spec)
export interface SessionItem {
  session_id: string;
  started_at: string;
}

export interface MessageItem {
  id: string;
  seq_no: number;
  message_payload: string;
  message_type?: string;
}

export interface SessionResponse {
  session_id: string;
  started_at: string;
}

export interface SessionMessagesResponse {
  session_id: string;
  messages: MessageItem[];
}

export interface SessionsListResponse {
  sessions: SessionItem[];
}

export const getSessions = () =>
  apiClient.request<SessionsListResponse>("/api/v1/thesys/session", {
    method: "GET",
  });

export const createChatSession = () =>
  apiClient.request<SessionResponse>("/api/v1/thesys/session", {
    method: "POST",
  });

export const getSessionMessages = (sessionId: string) =>
  apiClient.request<SessionMessagesResponse>(`/api/v1/thesys/session/${sessionId}`, {
    method: "GET",
  });

export const deleteSession = (sessionId: string) =>
  apiClient.request<void>(`/api/v1/thesys/session/${sessionId}`, {
    method: "DELETE",
  });

export interface SendChatMessageOptions {
  content: string;
  sessionId: string;
  brokerId?: string;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Send a chat message and handle SSE streaming response.
 * Returns the full accumulated content when streaming is complete.
 */
export const sendChatMessage = async ({
  content,
  sessionId,
  brokerId = "",
  onChunk,
  onComplete,
  onError,
}: SendChatMessageOptions): Promise<string> => {
  try {
    const response = await fetch("/api/thesys/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message_payload: { content },
        session_id: sessionId,
        broker_id: brokerId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("text/event-stream")) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const cleanedChunk = chunk.replace(/^data:\s*/gm, "");

        if (cleanedChunk.includes("[DONE]")) {
          continue;
        }

        accumulatedContent += cleanedChunk;
        onChunk?.(cleanedChunk);
      }

      onComplete?.(accumulatedContent);
      return accumulatedContent;
    } else {
      const data = await response.json();
      const responseContent = data.content || data.message || "No response";
      onComplete?.(responseContent);
      return responseContent;
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Unknown error occurred");
    onError?.(err);
    throw err;
  }
};
