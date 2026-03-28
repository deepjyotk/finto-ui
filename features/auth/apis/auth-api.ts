import { apiClient } from "@/lib/api/client";

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

export interface OTPResponse {
  message: string;
}

export interface OTPVerifyRequest {
  email: string;
  otp: string;
}

export const register = (data: UserCreate) =>
  apiClient.request<OTPResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const verifyOtp = (data: OTPVerifyRequest) =>
  apiClient.request<UserResponse>("/api/v1/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const login = (data: UserLogin) =>
  apiClient.request<UserResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const logoutApi = () =>
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
