"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { MessageSquare, Newspaper, Search, Bell, PieChart, Puzzle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { loadChatSessions, selectChatSessions, setChatSidebarOpen } from "@/features/chat/redux"
import type { AppDispatch, RootState } from "@/lib/store"
import { useOptionalChatShell } from "@/features/chat/components/chat-shell-context"

function isMdOrWider(): boolean {
  if (typeof window === "undefined") return true
  return window.matchMedia("(min-width: 768px)").matches
}

export default function PrimaryNavRail() {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const sessions = useSelector(selectChatSessions)
  const chatShell = useOptionalChatShell()

  useEffect(() => {
    if (!isAuthenticated) return
    if (pathname?.startsWith("/portfolio") || pathname?.startsWith("/integrations")) {
      dispatch(loadChatSessions())
    }
  }, [isAuthenticated, pathname, dispatch])

  const chatHref = useMemo(() => {
    if (!sessions.length) return "/chat/new"
    const latest = sessions.reduce((best, s) => {
      const t = new Date(s.started_at).getTime()
      return t > new Date(best.started_at).getTime() ? s : best
    })
    return `/chat/${latest.session_id}`
  }, [sessions])

  const isHomeActive = pathname === "/"
  const isChatActive =
    pathname === "/chat/new" ||
    (pathname?.startsWith("/chat/") ?? false)
  const isPortfolioActive = pathname === "/portfolio"
  const isIntegrationsActive = pathname === "/integrations" || pathname?.startsWith("/integrations/")

  const handleSearch = () => {
    if (pathname?.startsWith("/chat") && chatShell) {
      if (isMdOrWider()) {
        chatShell.focusSessionSearch()
      } else {
        dispatch(setChatSidebarOpen(true))
      }
      return
    }
    router.push(chatHref)
    if (!isMdOrWider()) {
      dispatch(setChatSidebarOpen(true))
    }
  }

  const itemClass = (active: boolean) =>
    cn(
      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111318]",
      active
        ? "bg-white/[0.09] text-white"
        : "text-gray-400 hover:bg-white/[0.05] hover:text-gray-200"
    )

  if (!isAuthenticated) {
    return null
  }

  return (
    <TooltipProvider delayDuration={300}>
      <nav
        aria-label="Primary"
        className="flex h-full w-[148px] shrink-0 flex-col border-r border-white/[0.06] bg-[#111318] py-3 pl-2 pr-2"
      >
        <ul className="flex flex-col gap-0.5" role="list">
          <li>
            <Link
              href="/"
              className={itemClass(isHomeActive)}
              aria-current={isHomeActive ? "page" : undefined}
            >
              <Newspaper
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  isHomeActive ? "text-[#22d3ee]" : "text-gray-500"
                )}
                aria-hidden
              />
              Home
            </Link>
          </li>
          <li>
            <Link
              href={chatHref}
              className={itemClass(isChatActive)}
              aria-current={isChatActive ? "page" : undefined}
            >
              <MessageSquare
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  isChatActive ? "text-[#22d3ee]" : "text-gray-500"
                )}
                aria-hidden
              />
              Chat
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={handleSearch}
              className={itemClass(false)}
            >
              <Search className="h-[18px] w-[18px] shrink-0 text-gray-500" aria-hidden />
              Search
            </button>
          </li>
          <li>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex w-full">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled
                    aria-disabled="true"
                    className={cn(
                      itemClass(false),
                      "h-auto cursor-not-allowed opacity-60 hover:bg-transparent hover:text-gray-400"
                    )}
                  >
                    <Bell className="h-[18px] w-[18px] shrink-0 text-gray-500" aria-hidden />
                    Alerts
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="right">Coming soon</TooltipContent>
            </Tooltip>
          </li>
          <li>
            <Link
              href="/portfolio"
              className={itemClass(isPortfolioActive)}
              aria-current={isPortfolioActive ? "page" : undefined}
            >
              <PieChart
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  isPortfolioActive ? "text-[#22d3ee]" : "text-gray-500"
                )}
                aria-hidden
              />
              Portfolio
            </Link>
          </li>
          <li>
            <Link
              href="/integrations"
              className={itemClass(isIntegrationsActive)}
              aria-current={isIntegrationsActive ? "page" : undefined}
            >
              <Puzzle
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  isIntegrationsActive ? "text-[#22d3ee]" : "text-gray-500"
                )}
                aria-hidden
              />
              Integrations
            </Link>
          </li>
        </ul>
      </nav>
    </TooltipProvider>
  )
}
