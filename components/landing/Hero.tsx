"use client"
import { motion } from "framer-motion"
import GetStartedButton from "@/components/landing/GetStartedButton"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import UserInitialsAvatar from "@/components/landing/UserInitialsAvatar"
import useKiteConnection from "@/lib/hooks/use-kite-connection"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { createWhatsAppConnectIntent } from "@/lib/api/integrations_api"
import { useState } from "react"
import AuthModal from "@/components/auth/auth-modal"
import { apiClient } from "@/lib/api/client"
import type { SessionsListResponse } from "@/lib/api/chat_api"

export default function Hero() {
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth)
  const { connected, getLoginUrl } = useKiteConnection()
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <section
      id="hero"
      className="relative overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_400px_at_50%_-50%,rgba(34,211,238,0.15),transparent_60%)]" />

      <div className="mx-auto max-w-7xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">
        <motion.span
          initial={{ opacity: 0, y: -6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#9AA7B2]"
        >
          ArthiQ - Finance Done Right
        </motion.span>

        <motion.h1
          id="hero-heading"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
          className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl"
        >
          Your AI layer on top of markets and your portfolio.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="mx-auto mt-5 max-w-2xl text-base text-[#9AA7B2] sm:text-lg"
        >
          Ask anything about stocks, fundamentals, technicals, or macro. Link your portfolio for personalized risk alerts and smart exposure analysis. No portals. No dashboards. Pure intelligence—delivered where you already work and communicate
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          className="mt-8 flex items-center justify-center gap-3 flex-wrap"
        >
          {isAuthenticated && user ? (
            <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2">
              <UserInitialsAvatar name={user.full_name} email={user.email} size={28} />
              <span className="text-sm">Hi, {user.full_name.split(" ")[0]}!</span>
            </span>
          ) : (
            <GetStartedButton />
          )}
          {/* {isAuthenticated && (
            !connected ? (
              <Button
                size="lg"
                variant="secondary"
                onClick={() => (window.location.href = getLoginUrl())}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                Connect Kite
              </Button>
            ) : (
              <Button
                size="lg"
                variant="secondary"
                onClick={() => router.push('/holdings')}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                View Holdings
              </Button>
            )
          )} */}
          <button
            onClick={async () => {
              if (isAuthenticated) {
                try {
                  const sessionResponse = await apiClient.request<SessionsListResponse>(
                    "/api/v1/thesys/session?page=1&page_limit=1",
                    { method: "GET" },
                  )

                  const latestSessionId = sessionResponse.sessions?.[0]?.session_id
                  router.push(latestSessionId ? `/chat/${latestSessionId}` : "/chat/new")
                } catch (error) {
                  console.error("Failed to load sessions:", error)
                  router.push('/chat/new')
                }
              } else {
                setShowAuthModal(true)
              }
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-transparent hover:bg-white/10 text-white font-semibold px-6 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            Try Playground
            <ArrowRight className="h-4 w-4" />
          </button>
          <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} defaultMode="register" />
        </motion.div>
      </div>
    </section>
  )
}
