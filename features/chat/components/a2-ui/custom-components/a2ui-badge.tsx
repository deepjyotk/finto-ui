import { cn } from "@/lib/utils"

interface BadgeProps {
  text: string
  variant?: "success" | "warning" | "error" | "info" | "neutral"
}

export function normalizeBadgeVariant(value: unknown): NonNullable<BadgeProps["variant"]> {
  return value === "success" ||
    value === "warning" ||
    value === "error" ||
    value === "info" ||
    value === "neutral"
    ? value
    : "neutral"
}

export function A2UIBadge({ text, variant = "neutral" }: BadgeProps) {
  const safeVariant = normalizeBadgeVariant(variant)
  const variantClass = {
    success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    error: "bg-red-500/20 text-red-300 border-red-500/30",
    info: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    neutral: "bg-white/10 text-gray-300 border-white/20",
  }[safeVariant]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClass
      )}
      aria-label={`Status: ${text}`}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          safeVariant === "success" && "bg-emerald-400",
          safeVariant === "warning" && "bg-amber-400",
          safeVariant === "error" && "bg-red-400",
          safeVariant === "info" && "bg-cyan-400",
          safeVariant === "neutral" && "bg-gray-400"
        )}
      />
      {text}
    </span>
  )
}
