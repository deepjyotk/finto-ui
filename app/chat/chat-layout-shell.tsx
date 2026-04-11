"use client"

import type { ReactNode } from "react"
import Header from "@/components/layout/header"
import PrimaryNavRail from "@/components/layout/primary-nav-rail"
import OldPersistentSidebar from "@/features/chat/components/old-persistent-sidebar"
import ChatSessionSidebar from "@/features/chat/components/chat-session-sidebar"
import { ChatShellProvider } from "@/features/chat/components/chat-shell-context"
import { CreditModalProvider } from "@/features/credits/components/credit-modal-provider"
import { FEATURE_FLAGS } from "@/lib/feature-flags"

export default function ChatLayoutShell({ children }: { children: ReactNode }) {
  if (!FEATURE_FLAGS.CURSOR_STYLE_UI_ENABLED) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-[#0B0F14]">
        <Header />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="hidden shrink-0 md:flex">
            <PrimaryNavRail />
          </div>
          <OldPersistentSidebar />
          <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
        </div>
        <CreditModalProvider />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0B0F14]">
      <Header />
      <ChatShellProvider>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="hidden shrink-0 md:flex">
            <PrimaryNavRail />
          </div>
          <ChatSessionSidebar />
          <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
        </div>
      </ChatShellProvider>
      <CreditModalProvider />
    </div>
  )
}
