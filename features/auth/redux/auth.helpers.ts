import { getCurrentUser, logoutApi, verifyAuth as verifyAuthApi } from "@/features/auth/apis/auth-api"

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

export async function getSession(): Promise<{ user: SessionUser | null }> {
  try {
    const data = await getCurrentUser()
    const user = toSessionUser(data)

    return { user }
  } catch (error) {
    console.error('Error fetching session:', error)
    return { user: null }
  }
}

export async function verifyAuth(): Promise<{ authenticated: boolean; user?: SessionUser }> {
  try {
    await verifyAuthApi()
  } catch (error) {
    console.error('Error verifying auth:', error)
    return { authenticated: false }
  }

  try {
    const currentUser = await getCurrentUser()
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

export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    await logoutApi()
    return { success: true }
  } catch (error) {
    console.error('Error signing out:', error)
    const errorMsg = error instanceof Error ? error.message : 'Failed to sign out'
    return { success: false, error: errorMsg }
  }
}
