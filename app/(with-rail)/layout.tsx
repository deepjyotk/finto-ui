import type { ReactNode } from "react"
import Header from "@/components/layout/header"
import PrimaryNavRail from "@/components/layout/primary-nav-rail"

export default function WithRailLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0B0F14]">
      <Header />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="hidden shrink-0 md:flex">
          <PrimaryNavRail />
        </div>
        <div className="min-w-0 flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  )
}
