import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "A2UI dev playground",
  description: "Paste A2UI JSON and preview rendered components.",
}

export default function DevA2UILayout({ children }: { children: ReactNode }) {
  return children
}
