import { apiClient } from "./client";

// Thesys C1Chat Types (from OpenAPI spec)
export interface C1Message {
  content: string;
}

export interface C1ChatRequest {
  message_payload: C1Message;
  session_id: string;
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
