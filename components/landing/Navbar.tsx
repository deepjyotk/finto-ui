"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import GetStartedButton from "@/components/landing/GetStartedButton"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import UserMenu from "@/components/landing/UserMenu"
import { Button } from "@/components/ui/button"
import { Sparkles, Cable } from "lucide-react"
import useKiteConnection from "@/lib/hooks/use-kite-connection"

const navItems = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#showcase", label: "Showcase" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState<string>("#")
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth)
  const router = useRouter()
  const { connected, getLoginUrl } = useKiteConnection()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })

    const sections = navItems
      .map((i) => document.querySelector(i.href) as HTMLElement | null)
      .filter(Boolean) as HTMLElement[]

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target?.id) setActive(`#${visible.target.id}`)
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0.1, 0.25, 0.5, 0.75] }
    )
    sections.forEach((s) => observer.observe(s))

    return () => {
      window.removeEventListener("scroll", onScroll)
      observer.disconnect()
    }
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full backdrop-blur border-b transition-all",
        scrolled ? "border-white/10 bg-[#0B0F14]/70" : "border-transparent bg-transparent"
      )}
      aria-label="Primary navigation"
    >
      <div className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all", scrolled ? "h-14" : "h-16")}>
        <Link href="/" className="flex items-center gap-3 group">
          <img src="/logo-brokerbuddy.svg" alt="Finto" className="h-7 w-7" />
          <span className="font-semibold tracking-tight">Finto</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-[#9AA7B2]" aria-label="In-page">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setActive(item.href)}
              aria-current={active === item.href ? "page" : undefined}
              className={cn(
                "transition-colors hover:text-white",
                active === item.href && "text-white"
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {!isAuthenticated && (
            <Link href="#pricing" className="hidden sm:inline-flex rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30">See Pricing</Link>
          )}
          {isAuthenticated && user ? (
            <>
              <Button 
                onClick={() => router.push("/integrations")}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                size="sm"
              >
                <Cable className="h-4 w-4 mr-2" />
                Integrations
              </Button>
              {/* <Button 
                onClick={() => router.push("/chat")}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Assist Me
              </Button> */}
              {connected && (
                <Button
                  onClick={() => router.push('/holdings')}
                  size="sm"
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  Holdings
                </Button>
              )}
              <UserMenu name={user.full_name} email={user.email} />
            </>
          ) : (
            <GetStartedButton className="px-4 py-2 text-sm" />
          )}
        </div>
      </div>
    </header>
  )
}


