import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import "@crayonai/react-ui/styles/index.css"


const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: {
    default: "Arthik — Your friendly AI broker companion.",
    template: "%s — Arthik",
  },
  description:
    "Trade smarter from WhatsApp. Get real-time alerts, confirm or auto-execute trades, and unify your portfolios across brokers—without app hopping.",
  applicationName: "Arthik",
  metadataBase: new URL("https://brokerbuddy.app"),
  openGraph: {
    type: "website",
    url: "https://brokerbuddy.app",
    title: "Arthik — Trade smarter from WhatsApp",
    description:
      "Get real-time alerts, confirm or auto-execute trades, and unify your portfolios across brokers—without app hopping.",
    siteName: "Arthik",
    images: [
      { url: "/og-brokerbuddy.svg", width: 1200, height: 630, alt: "Arthik" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arthik — Trade smarter from WhatsApp",
    description:
      "Get real-time alerts, confirm or auto-execute trades, and unify your portfolios across brokers—without app hopping.",
    images: ["/og-brokerbuddy.svg"],
    creator: "@brokerbuddy",
  },
  icons: { icon: "/placeholder-logo.png" },
  generator: "v0.dev",
}

export const viewport: Viewport = {
  themeColor: "#0B0F14",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth dark">
      <body className={`${inter.variable} ${jetbrains.variable} bg-[#0B0F14] text-[#E5EAF2] antialiased`}> 
        <Providers>
          <main className="min-h-dvh flex flex-col">{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
