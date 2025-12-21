export default function Testimonials() {
  const quotes = [
    {
      quote:
        "ArthiQ caught a concentration risk I didn't even realize I had. The alert saved me from a 15% drop.",
      author: "Priya S.",
      role: "Growth investor",
    },
    {
      quote: "Finally, portfolio monitoring that doesn't require logging into multiple dashboards. The insights are actionable and timely.",
      author: "Michael H.",
      role: "Diversified portfolio manager",
    },
    {
      quote:
        "I get Slack notifications when my portfolio drifts from my target allocation. Makes rebalancing so much easier.",
      author: "Anand R.",
      role: "Long-term investor",
    },
  ]
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Loved by Users</h2>
          <p className="mt-3 text-[#9AA7B2]">Real stories from early users.</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quotes.map((q) => (
            <figure key={q.author} className="rounded-2xl border border-white/10 bg-[#0F1621]/60 p-6 backdrop-blur">
              <blockquote className="text-sm leading-relaxed">“{q.quote}”</blockquote>
              <figcaption className="mt-4 text-xs text-[#9AA7B2]">
                — {q.author}, {q.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}


