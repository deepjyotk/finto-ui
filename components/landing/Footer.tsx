import Link from "next/link"

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* <img src="/logo-brokerbuddy.svg" alt="Finto" className="h-6 w-6" /> */}
            <span className="font-semibold">Finto</span>
          </div>
          <nav className="flex gap-4 text-sm text-[#9AA7B2]">
            <Link href="#features" className="hover:text-white">Features</Link>
            <Link href="#pricing" className="hover:text-white">Pricing</Link>
            <Link href="#faq" className="hover:text-white">FAQ</Link>
            <Link href="/signup" className="hover:text-white">Get Started</Link>
          </nav>
        </div>
        <p className="mt-6 text-xs text-[#9AA7B2]">
          Finto is not a broker-dealer or investment adviser. We provide portfolio monitoring and insights only. Investing involves risk.
        </p>
        <p className="mt-2 text-xs text-[#9AA7B2]">© {new Date().getFullYear()} Finto. All rights reserved.</p>
      </div>
    </footer>
  )
}


