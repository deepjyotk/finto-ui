import type { ReactNode } from "react"
import ChatSidebar from "@/features/chat/components/chat-sidebar"
import OldPersistentSidebar from "@/features/chat/components/old-persistent-sidebar"
import Header from "@/components/layout/header"
import { CreditModalProvider } from "@/features/credits/components/credit-modal-provider"
import { FEATURE_FLAGS } from "@/lib/feature-flags"

export default function ChatLayout({ children }: { children: ReactNode }) {
  if (!FEATURE_FLAGS.CURSOR_STYLE_UI_ENABLED) {
    return (
      <div className="flex h-screen flex-col bg-[#0B0F14] overflow-hidden">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <OldPersistentSidebar />
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
        <CreditModalProvider />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-[#0B0F14] overflow-hidden">
      <Header />
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
      <ChatSidebar />
      <CreditModalProvider />
    </div>
  )
}
