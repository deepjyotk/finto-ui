"use client"
import { useState } from "react"
import Link from "next/link"

type Tier = {
  name: string
  priceMonthly: string
  priceYearly: string
  features: string[]
  highlight?: boolean
}

const tiers: Tier[] = [
  {
    name: "Free",
    priceMonthly: "$0",
    priceYearly: "$0",
    features: ["Basic portfolio monitoring", "Weekly insights", "1 connected account", "Slack alerts"],
  },
  {
    name: "Pro",
    priceMonthly: "$19",
    priceYearly: "$190",
    features: ["Real-time risk alerts", "Advanced analytics", "Up to 3 accounts", "Custom alert preferences", "Performance tracking"],
    highlight: true,
  },
  {
    name: "Team",
    priceMonthly: "$49",
    priceYearly: "$490",
    features: ["Unlimited accounts", "Team dashboards", "Priority insights", "Dedicated support", "API access"],
  },
]

export default function Pricing() {
  const [yearly, setYearly] = useState(false)
  return (
    <section id="pricing" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Simple pricing for smart investors</h2>
          <p className="mt-3 text-[#9AA7B2]">Start free. Upgrade as your portfolio grows.</p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <button
            aria-pressed={!yearly}
            onClick={() => setYearly(false)}
            className={`rounded-full px-3 py-1 ${!yearly ? "bg-white/15" : "bg-transparent"}`}
          >
            Monthly
          </button>
          <button
            aria-pressed={yearly}
            onClick={() => setYearly(true)}
            className={`rounded-full px-3 py-1 ${yearly ? "bg-white/15" : "bg-transparent"}`}
          >
            Yearly
          </button>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border border-white/10 bg-[#0F1621]/60 p-6 backdrop-blur shadow-xl ${
                tier.highlight ? "ring-1 ring-cyan-300/20" : ""
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                {tier.highlight ? (
                  <span className="text-xs rounded-full bg-cyan-400/10 text-cyan-300 px-2 py-0.5">Popular</span>
                ) : null}
              </div>
              <div className="mt-4 text-3xl font-semibold">
                {yearly ? tier.priceYearly : tier.priceMonthly}
                <span className="ml-2 text-sm text-[#9AA7B2]">{yearly ? "/yr" : "/mo"}</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-[#9AA7B2]">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup#start"
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


