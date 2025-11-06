import { apiClient } from '@/lib/api/client'

export interface SessionUser {
  user_id: string
  username: string
  email: string
  full_name: string
}

const toSessionUser = (
  data?: Partial<SessionUser> & { user_id?: string }
): SessionUser | null => {
  if (!data || !data.user_id || !data.username || !data.email || !data.full_name) {
    return null
  }

  return {
    user_id: data.user_id,
    username: data.username,
    email: data.email,
    full_name: data.full_name,
  }
}

/**
 * Fetch current user session from the auth API
 * Uses GET /auth/me from OpenAPI spec
 */
export async function getSession(): Promise<{ user: SessionUser | null }> {
  try {
    const data = await apiClient.getCurrentUser()
    const user = toSessionUser(data)

    return { user }
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
    await apiClient.verifyAuth()
  } catch (error) {
    console.error('Error verifying auth:', error)
    return { authenticated: false }
  }

  try {
    const currentUser = await apiClient.getCurrentUser()
    const user = toSessionUser(currentUser)

    if (user) {
      return { authenticated: true, user }
    }

    return { authenticated: false }
  } catch (error) {
    console.error('Error fetching current user after verification:', error)
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