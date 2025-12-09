"use client"

import type React from "react"

import { Provider } from "react-redux"
import { store } from "@/lib/store"
import { SessionProvider } from "@/components/auth/session-provider"
import { ThemeProvider } from "@crayonai/react-ui"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </SessionProvider>
    </Provider>
  )
}
