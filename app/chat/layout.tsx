import type { ReactNode } from "react"
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0B0F14] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
