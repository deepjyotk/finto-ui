import { apiClient } from "./client";

// Auth Types (from OpenAPI spec)
export interface UserCreate {
  username: string;
  email: string;
  full_name: string;
  password: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface UserResponse {
  username: string;
  email: string;
  full_name: string;
  user_id: string;
}

export const register = (data: UserCreate) =>
  apiClient.request<UserResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const login = (data: UserLogin) =>
  apiClient.request<UserResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const logout = () =>
  apiClient.request<void>("/api/v1/auth/logout", {
    method: "POST",
  });

export const getCurrentUser = () =>
  apiClient.request<UserResponse>("/api/v1/auth/me", {
    method: "GET",
  });

export const verifyAuth = () =>
  apiClient.request<void>("/api/v1/auth/verify", {
    method: "GET",
  });
