import { Bell, TrendingUp, ShieldAlert, BarChart3, MessageSquare, Clock } from "lucide-react"


const features = [
  {
    title: "24/7 Portfolio Monitoring",
    desc: "Continuous tracking of your investments for hidden risks and imbalances.",
    icon: Clock,
  },
  {
    title: "Smart Risk Alerts",
    desc: "Get notified when your portfolio needs attention or rebalancing.",
    icon: ShieldAlert,
  },
  {
    title: "Performance Analytics",
    desc: "Track trends, analyze performance, and make data-driven decisions.",
    icon: TrendingUp,
  },
  {
    title: "Real-time Insights",
    desc: "Personalized portfolio insights delivered right when you need them.",
    icon: BarChart3,
  },
  {
    title: "Slack Integration",
    desc: "Receive alerts directly in Slack where you already work—no new app needed.",
    icon: MessageSquare,
  },
  {
    title: "Actionable Recommendations",
    desc: "Get clear, actionable guidance on what to do next with your investments.",
    icon: Bell,
  },
]

export default function Features() {
  return (
    <section id="features" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">What Finto Does</h2>
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


