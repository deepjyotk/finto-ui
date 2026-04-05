import { apiClient } from "@/lib/api/client";

// WhatsApp Connect Types
export interface ConnectIntentRequest {
  ttl_minutes?: number;
}

export interface ConnectIntentResponse {
  code: string;
  deeplink: string;
  expires_at: string;
}

export interface WhatsAppPayload {
  id: string;
  user_e164: string;
}

export interface ChatIntegration {
  whatsapp: WhatsAppPayload | null;
}

export interface BrokerPayload {
  broker_id: string;
  broker_name: string;
  broker_type: string;
  country: string;
}

export interface PortfolioUpdates {
  broker_id: string;
  broker_name: string;
  broker_user_id: string;
  last_updated_at: string;
  uploaded_via: string;
  additional_metadata: Record<string, string>;
}

export interface HoldingsMetadataSchema {
  chat_integrations: ChatIntegration[];
  available_brokers: BrokerPayload[];
  portfolio_updates: PortfolioUpdates[];
}

export interface BulkHoldingsUploadResponse {
  success: boolean;
  records_processed: number;
  message: string;
}

export interface DeleteBrokerHoldingsResponse {
  success: boolean;
  deleted_holdings_count: number;
  metadata_deleted: boolean;
  message: string;
}

export const createWhatsAppConnectIntent = (data: ConnectIntentRequest) =>
  apiClient.request<ConnectIntentResponse>("/api/v1/whatsapp/connect-intent", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const deleteWhatsAppIntegration = (integrationId: string) =>
  apiClient.request<void>(`/api/v1/whatsapp/${integrationId}`, {
    method: "DELETE",
  });

export const getHoldingsMetadata = () =>
  apiClient.request<HoldingsMetadataSchema>("/api/v1/holdings/metadata", {
    method: "GET",
  });

export const getKiteLoginUrl = () => `${apiClient.getBaseUrl()}/api/v1/kite/login`;

export const kiteTokenInfo = () =>
  apiClient.request<{ connected: boolean; session?: any }>("/api/v1/kite/token", {
    method: "GET",
  });

export const kiteStatus = () =>
  apiClient.request<{ connected: boolean; user_id: string }>("/api/v1/kite/status", {
    method: "GET",
  });

export const kiteHoldings = () =>
  apiClient.request<any>("/api/v1/kite/holdings", {
    method: "GET",
  });

export const createHolding = (data: any) =>
  apiClient.request<any>("/api/v1/holdings", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const uploadHoldingsFile = (formData: FormData) =>
  apiClient.request<BulkHoldingsUploadResponse>("/api/v1/holdings/file-upload", {
    method: "POST",
    body: formData,
    headers: {},
  });

export const updateHoldingsFile = (userBrokerId: string, formData: FormData) =>
  apiClient.request<BulkHoldingsUploadResponse>(`/api/v1/holdings/file-upload/${userBrokerId}`, {
    method: "PUT",
    body: formData,
    headers: {},
  });

export const healthCheck = () =>
  apiClient.request<any>("/healthz", {
    method: "GET",
  });

export const deleteBrokerHoldings = (brokerId: string) =>
  apiClient.request<DeleteBrokerHoldingsResponse>(`/api/v1/holdings/broker/${brokerId}`, {
    method: "DELETE",
  });

/** smallcase Gateway — holdings import (no DB); server logs portfolio analytics. */
export interface GatewayHoldingsImportStartResponse {
  gateway_name: string;
  guest_auth_token: string;
  transaction_id: string;
  transaction_expire_at: string | null;
}

export const startGatewayHoldingsImport = () =>
  apiClient.request<GatewayHoldingsImportStartResponse>("/api/v1/gateway/holdings-import/start", {
    method: "POST",
    body: JSON.stringify({}),
  });

export interface GatewayFetchHoldingsResponse {
  success: boolean;
  analytics: Record<string, unknown>;
  message: string;
}

export const fetchGatewayHoldingsAndLog = (
  smallcaseAuthToken: string,
  mfHoldings = false
) =>
  apiClient.request<GatewayFetchHoldingsResponse>("/api/v1/gateway/holdings/fetch", {
    method: "POST",
    body: JSON.stringify({
      smallcase_auth_token: smallcaseAuthToken,
      mf_holdings: mfHoldings,
    }),
  });
