import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: {
    default: "Finto — Your friendly AI broker companion.",
    template: "%s — Finto",
  },
  description:
    "Trade smarter from WhatsApp. Get real-time alerts, confirm or auto-execute trades, and unify your portfolios across brokers—without app hopping.",
  applicationName: "Finto",
  metadataBase: new URL("https://brokerbuddy.app"),
  openGraph: {
    type: "website",
    url: "https://brokerbuddy.app",
    title: "Finto — Trade smarter from WhatsApp",
    description:
      "Get real-time alerts, confirm or auto-execute trades, and unify your portfolios across brokers—without app hopping.",
    siteName: "Finto",
    images: [
      { url: "/og-brokerbuddy.svg", width: 1200, height: 630, alt: "Finto" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Finto — Trade smarter from WhatsApp",
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
        </Providers>
      </body>
    </html>
  )
}
