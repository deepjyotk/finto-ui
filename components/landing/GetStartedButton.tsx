"use client"
import { useState } from "react"
import AuthModal from "@/components/auth/auth-modal"
import { cn } from "@/lib/utils"

interface GetStartedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary"
}

export default function GetStartedButton({
  className,
  children = "Get Started — It’s Free",
  variant = "primary",
  ...props
}: GetStartedButtonProps) {
  const [open, setOpen] = useState(false)
  const base =
    variant === "primary"
      ? "rounded-2xl bg-cyan-400/90 hover:bg-cyan-400 text-black font-semibold px-6 py-3 shadow-[0_0_0_2px_rgba(34,211,238,0.2)] hover:shadow-[0_0_0_6px_rgba(139,92,246,0.25)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      : "rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(base, className)}
        {...props}
      >
        {children}
      </button>
      <AuthModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}


