"use client"

import { motion } from "framer-motion"
import TickerSearchBar from "./TickerSearchBar"

export default function TickerSearchSection() {
  return (
    <section className="relative py-16 sm:py-20">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_50%_50%,rgba(34,211,238,0.06),transparent_70%)]" />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#22d3ee]"
        >
          Stock Explorer
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
          className="mb-2 text-2xl font-bold text-white sm:text-3xl"
        >
          Explore Indian Stocks
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
          className="mb-8 text-sm text-gray-500"
        >
          Search by company name or NSE symbol
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.12 }}
        >
          <TickerSearchBar />
        </motion.div>
      </div>
    </section>
  )
}
