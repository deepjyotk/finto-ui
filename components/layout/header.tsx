"use client"

import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/lib/store"
import { logout } from "@/lib/features/auth/auth-slice"
import { toggleSidebar } from "@/lib/features/ui/ui-slice"
import { signOut } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { Menu, Plus, Sparkles } from "lucide-react"
import AuthModal from "@/components/auth/auth-modal"
import { useState } from "react"
import useKiteConnection from "@/lib/hooks/use-kite-connection"
import { useRouter, usePathname } from "next/navigation"

export default function Header() {
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const { connected, getLoginUrl } = useKiteConnection()

  const handleLogout = async () => {
    try {
      const { success, error } = await signOut()
      if (success) {
        dispatch(logout())
        // Refresh the page to clear any cached state
        window.location.href = '/'
      } else {
        console.error('Logout error:', error)
      }
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  const handleNewChat = () => {
    router.push("/chat/new")
  }

  const handleAssistMe = () => {
    router.push("/chat")
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => dispatch(toggleSidebar())} className="lg:hidden text-gray-700 hover:bg-gray-100">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold text-gray-900">Finto</h1>
      </div>

      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <>
            {!pathname?.startsWith('/chat') && (
              <Button variant="default" size="sm" onClick={handleAssistMe} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                <Sparkles className="h-4 w-4 mr-2" />
                Assist me
              </Button>
            )}
            {pathname?.startsWith('/chat') && (
              <Button variant="ghost" size="sm" onClick={handleNewChat}>
                <Plus className="h-4 w-4 mr-2" />
                New chat
              </Button>
            )}
            {/* Kite connection quick actions */}
            {!connected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = getLoginUrl())}
                className="border-green-600 text-green-700 hover:bg-green-50"
              >
                Connect Kite
              </Button>
            )}
            {connected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/holdings')}
                className="border-green-600 text-green-700 hover:bg-green-50"
              >
                Holdings
              </Button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{user?.full_name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowAuthModal(true)}>
              Log in
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAuthModal(true)}>
              Sign up for free
            </Button>
          </>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  )
}
