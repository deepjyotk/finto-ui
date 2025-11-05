import { apiClient, type UserResponse } from '@/lib/api/client'

export interface SessionUser {
  user_id: string
  username: string
  email: string
  full_name: string
}

/**
 * Fetch current user session from the auth API
 * Uses GET /auth/me from OpenAPI spec
 */
export async function getSession(): Promise<{ user: SessionUser | null }> {
  try {
    const data = await apiClient.getCurrentUser()
    
    if (data && data.user_id) {
      return {
        user: {
          user_id: data.user_id,
          username: data.username,
          email: data.email,
          full_name: data.full_name
        }
      }
    }
    
    return { user: null }
  } catch (error) {
    console.error('Error fetching session:', error)
    return { user: null }
  }
}

/**
 * Verify authentication status
 * Uses GET /auth/verify from OpenAPI spec
 */
export async function verifyAuth(): Promise<{ authenticated: boolean; user?: SessionUser }> {
  try {
    const data = await apiClient.verifyAuth()
    
    if (data.authenticated && data.user) {
      return {
        authenticated: true,
        user: {
          user_id: data.user.user_id,
          username: data.user.username,
          email: data.user.email,
          full_name: data.user.full_name
        }
      }
    }
    
    return { authenticated: false }
  } catch (error) {
    console.error('Error verifying auth:', error)
    return { authenticated: false }
  }
}

/**
 * Sign out current user
 * Uses POST /auth/logout from OpenAPI spec
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.logout()
    return { success: true }
  } catch (error) {
    console.error('Error signing out:', error)
    const errorMsg = error instanceof Error ? error.message : 'Failed to sign out'
    return { success: false, error: errorMsg }
  }
}