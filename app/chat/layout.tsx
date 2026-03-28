import type { ReactNode } from "react"
import ChatSidebar from "@/features/chat/components/chat-sidebar"
import Header from "@/components/layout/header"
import { CreditModalProvider } from "@/features/credits/components/credit-modal-provider"

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0B0F14] overflow-hidden">
      <ChatSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
      <CreditModalProvider />
    </div>
  )
}
