"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import AuthModal from "@/components/auth/auth-modal"

export default function SignupPage() {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    setOpen(true)
  }, [])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#0F1621]/60 backdrop-blur p-8 text-center shadow-xl">
        <h1 className="text-2xl font-semibold tracking-tight">Create your Finto account</h1>
        <p className="mt-2 text-sm text-[#9AA7B2]">Sign up to get started with Finto</p>
        <div className="mt-6">
          <p className="text-sm text-[#9AA7B2]">
            By continuing you agree to our{" "}
            <Link className="underline hover:text-white" href="#">
              Terms
            </Link>{" "}
            and{" "}
            <Link className="underline hover:text-white" href="#">
              Privacy
            </Link>
            .
          </p>
        </div>
      </div>
      <AuthModal isOpen={open} onClose={() => setOpen(false)} defaultMode="register" />
    </div>
  )
}


