const faqs = [
  {
    q: "Is ArthiQ a broker or financial advisor?",
    a: "No. ArthiQ is a portfolio intelligence platform. We don't execute trades or provide investment advice—we help you analyze and understand your portfolio through AI-powered insights.",
  },
  {
    q: "How do I add my portfolio to ArthiQ?",
    a: "You can upload your holdings by uploading Excel or CSV files from your broker. ArthiQ supports multiple brokers including Zerodha, AngelOne, and Grow.",
  },
  {
    q: "How does the AI portfolio analysis work?",
    a: "Simply ask questions about your portfolio in natural language. Our AI assistant analyzes your holdings, calculates metrics, and provides instant answers. You can ask about profit/loss, risk metrics, allocations, or any custom analysis.",
  },
  {
    q: "What kind of portfolio questions can I ask?",
    a: "You can ask questions about profit and loss, risk metrics (volatility, drawdown), performance comparisons, sector allocations, individual stock analysis, or request custom calculations. The AI generates calculations on-demand to answer your specific questions.",
  },
  {
    q: "Is my financial data secure?",
    a: "Absolutely. We use bank-level encryption and secure connections. Your data stays private and is never shared with third parties.",
  },
  {
    q: "Can I access real-time market data?",
    a: "Yes. ArthiQ integrates with financial data sources to provide live prices, financial statements, earnings data, and market news from NSE, BSE, and SEBI sources.",
  },
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


