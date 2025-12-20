const faqs = [
  {
    q: "Is ArthiQ a broker or financial advisor?",
    a: "No. ArthiQ is a portfolio monitoring and insights platform. We don't execute trades or provide investment advice—we help you stay informed about your portfolio.",
  },
  { q: "How does ArthiQ monitor my portfolio?", a: "Once you securely connect your investment accounts, ArthiQ continuously analyzes your holdings for risks, imbalances, and opportunities." },
  { q: "Where do I receive alerts?", a: "ArthiQ delivers insights directly to Slack. WhatsApp and email notifications are coming soon." },
  { q: "Is my financial data secure?", a: "Absolutely. We use bank-level encryption and secure OAuth connections. Your data stays private and is never shared with third parties." },
  { q: "Which brokers and platforms are supported?", a: "ArthiQ works with major brokers including Alpaca, IBKR, Zerodha, AngelOne, Tradier, and Robinhood. More integrations coming soon." },
  { q: "Can I customize what alerts I receive?", a: "Yes! You can set preferences for risk thresholds, rebalancing alerts, and performance notifications based on your investment strategy." },
]

export default function FAQ() {
  return (
    <section id="faq" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Frequently asked questions</h2>
        </div>
        <dl className="mt-10 grid gap-4 sm:gap-6 sm:grid-cols-2">
          {faqs.map((item) => (
            <div key={item.q} className="rounded-2xl border border-white/10 bg-[#0F1621]/60 p-5 backdrop-blur">
              <dt className="font-medium">{item.q}</dt>
              <dd className="mt-2 text-sm text-[#9AA7B2]">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}


