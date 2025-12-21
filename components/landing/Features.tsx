import { Upload, Brain, Gauge, Zap, Newspaper, Calculator } from "lucide-react"


const features = [
  {
    title: "Multi-Broker Portfolio Upload",
    desc: "Upload Excel and CSV files from brokers",
    icon: Upload,
  },
  {
    title: "AI-Powered Portfolio Analysis",
    desc: "Get instant answers to portfolio questions naturally",
    icon: Brain,
  },
  {
    title: "Automated Risk & Performance Metrics",
    desc: "Calculate volatility, drawdown, profit-loss, and analytics",
    icon: Gauge,
  },
  {
    title: "Real-Time Financial Data Integration",
    desc: "Access live prices, financial statements, and earnings",
    icon: Zap,
  },
  {
    title: "Market News & Research",
    desc: "Search NSE, BSE, SEBI circulars and news",
    icon: Newspaper,
  },
  {
    title: "Custom Financial Calculations",
    desc: "Generate custom calculations for any portfolio question",
    icon: Calculator,
  },
]

export default function Features() {
  return (
    <section id="features" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">What Arthik Does</h2>
          <p className="mt-3 text-[#9AA7B2]">Private. Proactive. Powerful portfolio intelligence.</p>
        </div>

        <div className="mt-10 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, desc, icon: Icon }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/10 bg-[#0F1621]/60 p-5 sm:p-6 shadow-xl backdrop-blur transition transform will-change-transform hover:-translate-y-0.5 hover:shadow-[0_0_0_2px_rgba(139,92,246,0.15)]"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/5 p-2.5 text-cyan-300 ring-1 ring-white/10">
                  <Icon size={20} />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
              <p className="mt-3 text-sm text-[#9AA7B2]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


