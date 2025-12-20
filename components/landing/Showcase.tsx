"use client"
import { motion, useReducedMotion } from "framer-motion"

export default function Showcase() {
  const prefersReduced = useReducedMotion()
  return (
    <section id="showcase" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">See it in action</h2>
          <p className="mt-3 text-[#9AA7B2]">Get portfolio insights delivered right to Slack—no dashboard required.</p>
        </div>

        <div className="mt-10 flex justify-center">
          <motion.div
            initial={prefersReduced ? false : { rotateX: 6, rotateY: -6, opacity: 0, y: 10 }}
            whileInView={prefersReduced ? {} : { rotateX: 0, rotateY: 0, opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ type: "spring", stiffness: 80, damping: 12 }}
            className="w-full max-w-5xl rounded-2xl border border-white/10 bg-[#0F1621]/60 p-3 shadow-2xl backdrop-blur"
          >
            {/* Simple browser frame */}
            <div className="rounded-lg border border-white/10 bg-[#121A26]">
              <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
                <span className="h-3 w-3 rounded-full bg-cyan-400/80" />
                <div className="mx-3 flex-1 rounded bg-white/5 px-3 py-1 text-xs text-[#9AA7B2]">
                  app.arthiq.io/dashboard
                </div>
              </div>
              {/* TODO: Replace with real screenshot */}
              <img
                src="/screenshots/mock-dashboard.png"
                alt="ArthiQ dashboard mock"
                className="w-full rounded-b-lg"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}


