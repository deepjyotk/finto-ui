import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string
  change?: string
}

export function A2UIMetricCard({ label, value, change }: MetricCardProps) {
  const isPositive = change?.startsWith("+")
  const isNegative = change?.startsWith("-")

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-white">{value}</p>
      {change && (
        <p
          className={cn(
            "mt-0.5 text-xs font-medium",
            isPositive && "text-emerald-400",
            isNegative && "text-red-400",
            !isPositive && !isNegative && "text-gray-400"
          )}
        >
          {change}
        </p>
      )}
    </div>
  )
}
