"use client"

import type React from "react"

import { GoogleOAuthProvider } from "@react-oauth/google"
import { useEffect, useState } from "react"
import { Provider } from "react-redux"
import { store } from "@/lib/store"
import { SessionProvider } from "@/features/auth/components/session-provider"
import { ThemeProvider } from "@crayonai/react-ui"

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""

export function Providers({ children }: { children: React.ReactNode }) {
  // Delay ThemeProvider to client mount to avoid SSR/client style UID mismatch from crayon ThemeProvider
  const [themeReady, setThemeReady] = useState(false)
  useEffect(() => setThemeReady(true), [])

  const themedChildren = themeReady ? <ThemeProvider>{children}</ThemeProvider> : children

  const withGoogle =
    googleClientId.length > 0 ? (
      <GoogleOAuthProvider clientId={googleClientId}>{themedChildren}</GoogleOAuthProvider>
    ) : (
      themedChildren
    )

  return (
    <Provider store={store}>
      <SessionProvider>{withGoogle}</SessionProvider>
    </Provider>
  )
}
