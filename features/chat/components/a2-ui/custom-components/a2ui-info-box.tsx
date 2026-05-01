import { cn } from "@/lib/utils"

interface InfoBoxProps {
  text: string
  variant?: "info" | "warning" | "success" | "error"
}

export function normalizeInfoBoxVariant(value: unknown): NonNullable<InfoBoxProps["variant"]> {
  return value === "info" || value === "warning" || value === "success" || value === "error"
    ? value
    : "info"
}

export function A2UIInfoBox({ text, variant = "info" }: InfoBoxProps) {
  const safeVariant = normalizeInfoBoxVariant(variant)
  const styles = {
    info: {
      wrapper: "border-cyan-500/20 bg-cyan-950/20",
      icon: "text-cyan-400",
      text: "text-cyan-200",
    },
    warning: {
      wrapper: "border-amber-500/20 bg-amber-950/20",
      icon: "text-amber-400",
      text: "text-amber-200",
    },
    success: {
      wrapper: "border-emerald-500/20 bg-emerald-950/20",
      icon: "text-emerald-400",
      text: "text-emerald-200",
    },
    error: {
      wrapper: "border-red-500/20 bg-red-950/20",
      icon: "text-red-400",
      text: "text-red-200",
    },
  }[safeVariant]

  return (
    <div
      className={cn("flex items-start gap-2.5 rounded-lg border px-4 py-3", styles.wrapper)}
      aria-label={`${safeVariant} notice`}
      role="note"
    >
      <svg
        className={cn("mt-0.5 h-4 w-4 flex-shrink-0", styles.icon)}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className={cn("text-sm", styles.text)}>{text}</p>
    </div>
  )
}
