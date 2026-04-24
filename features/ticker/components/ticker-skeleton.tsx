export default function TickerSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6 px-4 py-6">
      {/* Nav skeleton */}
      <div className="h-16 rounded-2xl bg-white/[0.05]" />

      {/* Summary card */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-5">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="space-y-3 md:w-64">
            <div className="h-6 w-48 rounded-lg bg-white/10" />
            <div className="h-4 w-32 rounded bg-white/[0.06]" />
            <div className="h-8 w-36 rounded-lg bg-white/10" />
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-white/[0.05]" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 rounded-2xl border border-white/[0.07] bg-[#111318]" />

      {/* P&L table */}
      <div className="space-y-2 rounded-2xl border border-white/[0.07] bg-[#111318] p-5">
        <div className="h-4 w-40 rounded bg-white/10" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-white/[0.04]" />
        ))}
      </div>
    </div>
  )
}
