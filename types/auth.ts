/**
 * Auth types matching OpenAPI spec
 */
export interface AuthUser {
  user_id: string
  username: string
  email: string
  full_name: string
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginFormData {
  username: string
  password: string
}

export interface RegisterFormData {
  username: string
  email: string
  full_name: string
  password: string
  confirmPassword: string
}