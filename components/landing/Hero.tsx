"use client"
import { motion } from "framer-motion"
import GetStartedButton from "@/components/landing/GetStartedButton"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import UserInitialsAvatar from "@/components/landing/UserInitialsAvatar"
import useKiteConnection from "@/lib/hooks/use-kite-connection"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api/client"
import { useState } from "react"

export default function Hero() {
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth)
  const { connected, getLoginUrl } = useKiteConnection()
  const router = useRouter()
  const [isConnectingWhatsApp, setIsConnectingWhatsApp] = useState(false)

  const handleWhatsAppConnect = async () => {
    if (!user?.user_id) return
    
    setIsConnectingWhatsApp(true)
    try {
      const response = await apiClient.createWhatsAppConnectIntent({
        user_id: user.user_id,
        ttl_minutes: 10
      })
      
      // Open the WhatsApp deeplink in a new tab
      window.open(response.deeplink, '_blank')
    } catch (error) {
      console.error('Failed to create WhatsApp connect intent:', error)
      alert('Failed to connect WhatsApp. Please try again.')
    } finally {
      setIsConnectingWhatsApp(false)
    }
  }

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
          🪙 Finto — Finance Done Right
        </motion.span>

        <motion.h1
          id="hero-heading"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
          className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl"
        >
          Invest smarter. React faster.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="mx-auto mt-5 max-w-2xl text-base text-[#9AA7B2] sm:text-lg"
        >
          Finto keeps you ahead of market shifts by delivering real-time portfolio insights and risk alerts—right where you already work and chat. No dashboards. No logins. No noise.
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
          {isAuthenticated && (
            !connected ? (
              <Button
                size="lg"
                variant="secondary"
                onClick={() => (window.location.href = getLoginUrl())}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Connect Kite
              </Button>
            ) : (
              <Button
                size="lg"
                variant="secondary"
                onClick={() => router.push('/holdings')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                View Holdings
              </Button>
            )
          )}
          {isAuthenticated && (
            <div className="flex flex-col items-center gap-1">
              <Button
                size="lg"
                variant="secondary"
                onClick={handleWhatsAppConnect}
                disabled={isConnectingWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isConnectingWhatsApp ? 'Connecting...' : '📱 Connect WhatsApp'}
              </Button>
              <span className="text-xs text-[#9AA7B2] max-w-[200px] text-center">
                Chat with Finto directly on WhatsApp for portfolio insights and alerts.
              </span>
            </div>
          )}
          <a
            href="#showcase"
            className="rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            See How It Works
          </a>
        </motion.div>
      </div>
    </section>
  )
}


