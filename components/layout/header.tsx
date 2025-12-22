"use client"

import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/lib/store"
import { logout } from "@/lib/slices/auth"
import { setSidebarOpen } from "@/lib/slices/ui"
import { signOut } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, Plus, ExternalLink, LogOut, Puzzle } from "lucide-react"
import AuthModal from "@/components/auth/auth-modal"
import { useState } from "react"
import useKiteConnection from "@/lib/hooks/use-kite-connection"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

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

  const getUserInitials = () => {
    if (!user?.full_name || user.full_name.trim() === "") return "U"
    
    // Split by spaces and filter out empty strings
    const names = user.full_name.trim().split(" ").filter(name => name.length > 0)
    
    if (names.length === 0) return "U"
    if (names.length === 1) return names[0][0].toUpperCase()
    
    // Get first and last name initials
    return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  }

  // Navigation items
  const navItems: Array<{ href: string; label: string; badge?: string; external?: boolean }> = [
    { href: "/pricing", label: "Pricing" },
    { href: "/examples", label: "Examples" },
    { href: "/docs", label: "Docs", external: true },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0B0F14] border-b border-white/10 backdrop-blur-sm">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo + Mobile Menu */}
          <div className="flex items-center gap-4">
            {pathname?.startsWith('/chat') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => dispatch(setSidebarOpen(true))}
                className="lg:hidden text-white hover:bg-white/10 h-9 w-9"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-xl font-semibold text-white tracking-tight">
                Arthik
              </span>
            </Link>

            {/* Desktop Navigation - Hidden on /chat pages */}
            {!pathname?.startsWith('/chat') && (
              <nav className="hidden md:flex items-center gap-6 ml-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className={cn(
                      "flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors relative group",
                      pathname === item.href && "text-white"
                    )}
                  >
                    {item.label}
                    {item.badge && (
                      <Badge 
                        className="ml-1 bg-purple-500/20 text-purple-300 border-purple-500/30 px-1.5 py-0 text-[10px] font-medium h-4"
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {item.external && (
                      <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    )}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open("https://calendar.app.google/54M32xpq4xHS93Sm6", "_blank")}
              className="text-white hover:bg-white/10 rounded-lg"
            >
              Schedule demo
            </Button>
            {isAuthenticated ? (
              <>
                {/* Integrations button - icon-only on mobile, full button on desktop */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/integrations')}
                  className={cn(
                    "flex items-center gap-2 transition-colors",
                    "sm:gap-2",
                    pathname === '/integrations'
                      ? "text-[#22d3ee] hover:text-[#67e8f9] bg-[#22d3ee]/10 hover:bg-[#22d3ee]/15 border border-[#22d3ee]/30 shadow-[0_0_8px_rgba(34,211,238,0.2)]"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  )}
                  aria-label="Integrations"
                >
                  <Puzzle className="h-4 w-4" />
                  <span className="hidden sm:inline">Integrations</span>
                </Button>
                {pathname?.startsWith('/chat') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNewChat}
                    className="text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New chat
                  </Button>
                )}
                {/* {!connected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = getLoginUrl())}
                    className="hidden sm:flex border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500"
                  >
                    Connect Kite
                  </Button>
                )} */}
                {connected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/holdings')}
                    className="hidden sm:flex border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500"
                  >
                    Holdings
                  </Button>
                )}
                {!pathname?.startsWith('/chat') && (
                  <div className="flex items-center pl-2 border-l border-white/10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex items-center gap-2 text-white/80 hover:text-white hover:bg-white/10 h-auto py-1.5 px-2"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-[#c96a2f] text-white text-sm font-semibold">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="hidden sm:inline text-sm font-medium">
                            {user?.full_name || "User"}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 bg-[#1a1b23] border-white/10 text-white"
                      >
                        <DropdownMenuItem
                          onClick={() => router.push('/integrations')}
                          className={cn(
                            "text-white/90 hover:bg-white/10 cursor-pointer focus:bg-white/10 focus:text-white",
                            pathname === '/integrations' && "bg-[#22d3ee]/10 text-[#22d3ee]"
                          )}
                        >
                          <Puzzle className="h-4 w-4 mr-2" />
                          Integrations
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleLogout}
                          className="text-white/90 hover:bg-white/10 cursor-pointer focus:bg-white/10 focus:text-white"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Log out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="bg-white text-[#0B0F14] hover:bg-white/90 rounded-lg font-medium"
              >
                Log in
              </Button>
            )}
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  )
}
