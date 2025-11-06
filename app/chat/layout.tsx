"use client"

import type React from "react"
import Sidebar from "@/components/layout/sidebar"

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#343541] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}

