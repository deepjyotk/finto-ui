"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Provider } from "react-redux"
import { store } from "@/lib/store"
import { SessionProvider } from "@/components/auth/session-provider"
import { ThemeProvider } from "@crayonai/react-ui"

export function Providers({ children }: { children: React.ReactNode }) {
  // Delay ThemeProvider to client mount to avoid SSR/client style UID mismatch from crayon ThemeProvider
  const [themeReady, setThemeReady] = useState(false)
  useEffect(() => setThemeReady(true), [])

  const themedChildren = themeReady ? <ThemeProvider>{children}</ThemeProvider> : children

  return (
    <Provider store={store}>
      <SessionProvider>
        {themedChildren}
      </SessionProvider>
    </Provider>
  )
}
