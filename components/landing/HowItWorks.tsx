import { Link2, Bell, TrendingUp } from "lucide-react"

const steps = [
  {
    title: "Connect Your Portfolio",
    desc: "Securely link your investment accounts and brokers.",
    icon: Link2,
  },
  {
    title: "Get Smart Alerts",
    desc: "Receive real-time notifications about risks and opportunities.",
    icon: Bell,
  },
  {
    title: "Make Better Decisions",
    desc: "Act on insights delivered directly to your Slack workspace.",
    icon: TrendingUp,
  },
]

export default function HowItWorks() {
  return (
    <section id="how" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">How it works</h2>
          <p className="mt-3 text-[#9AA7B2]">Three simple steps to smarter investing.</p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map(({ title, desc, icon: Icon }, idx) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-[#0F1621]/60 p-6 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-cyan-300 ring-1 ring-white/10">
                  <Icon size={18} />
                </span>
                <div className="text-sm text-[#9AA7B2]">Step {idx + 1}</div>
              </div>
              <h3 className="mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-[#9AA7B2]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


