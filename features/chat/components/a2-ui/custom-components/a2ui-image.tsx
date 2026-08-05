"use client"

import { useEffect, useMemo, useState, type CSSProperties } from "react"

const CDN_BASE =
  process.env.NEXT_PUBLIC_CDN_BASE_URL?.replace(/\/$/, "") ??
  "https://pub-02ae21b71a13498f94e99ef653d36c8a.r2.dev"

const GCS_BASE =
  process.env.NEXT_PUBLIC_GCS_LOGOS_BASE_URL?.replace(/\/$/, "") ??
  "https://storage.googleapis.com/finto-logos"

function extractLogoSymbol(url: string): string | null {
  try {
    const pathname = new URL(url).pathname
    const file = pathname.split("/").pop() ?? ""
    const match = file.match(/^([A-Za-z0-9.-]+)\.(svg|png)$/i)
    if (!match) return null
    return match[1].replace(/\.(NS|BO|BSE)$/i, "").toUpperCase()
  } catch {
    return null
  }
}

function isLogoHost(url: string): boolean {
  try {
    const host = new URL(url).origin
    return host === new URL(CDN_BASE).origin || host === new URL(GCS_BASE).origin
  } catch {
    return false
  }
}

/** Probe order mirrors company-logo.tsx / DataTable company_identity. */
function buildLogoCandidates(symbol: string, preferredUrl?: string): string[] {
  const s = symbol.toUpperCase()
  const candidates = [
    `${CDN_BASE}/${s}.svg`,
    `${CDN_BASE}/${s}.png`,
    `${GCS_BASE}/${s}.svg`,
    `${GCS_BASE}/${s}.png`,
  ]
  if (preferredUrl && !candidates.includes(preferredUrl)) {
    return [preferredUrl, ...candidates]
  }
  if (preferredUrl) {
    return [preferredUrl, ...candidates.filter((c) => c !== preferredUrl)]
  }
  return candidates
}

function mapFit(fit: string | undefined): CSSProperties["objectFit"] {
  if (fit === "scaleDown") return "scale-down"
  return (fit as CSSProperties["objectFit"]) || "fill"
}

export interface A2UIImageProps {
  url: string
  description?: string
  fit?: "contain" | "cover" | "fill" | "none" | "scaleDown"
  variant?: "icon" | "avatar" | "smallFeature" | "mediumFeature" | "largeFeature" | "header"
  weight?: number | string
}

export function A2UIImage({ url, description, fit, variant }: A2UIImageProps) {
  const candidates = useMemo(() => {
    if (!url || !isLogoHost(url)) return [url]
    const symbol = extractLogoSymbol(url)
    if (!symbol) return [url]
    return buildLogoCandidates(symbol, url)
  }, [url])

  const [candidateIdx, setCandidateIdx] = useState(0)

  useEffect(() => {
    setCandidateIdx(0)
  }, [url])

  const currentUrl = candidates[Math.min(candidateIdx, candidates.length - 1)] ?? url

  const style: CSSProperties = {
    objectFit: mapFit(fit),
    display: "block",
    borderRadius: "var(--a2ui-image-border-radius, 0)",
  }

  if (variant === "icon") {
    style.width = "var(--a2ui-image-icon-size, 24px)"
    style.height = "var(--a2ui-image-icon-size, 24px)"
  } else if (variant === "avatar") {
    style.width = "var(--a2ui-image-avatar-size, 40px)"
    style.height = "var(--a2ui-image-avatar-size, 40px)"
    style.borderRadius = "50%"
  } else if (variant === "smallFeature") {
    style.maxWidth = "var(--a2ui-image-small-feature-size, 100px)"
  } else if (variant === "largeFeature") {
    style.maxHeight = "var(--a2ui-image-large-feature-size, 400px)"
  } else if (variant === "header") {
    style.height = "var(--a2ui-image-header-size, 200px)"
    style.objectFit = "cover"
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={currentUrl}
      src={currentUrl}
      alt={description || ""}
      style={style}
      onError={() => {
        if (candidateIdx < candidates.length - 1) {
          setCandidateIdx((idx) => idx + 1)
        }
      }}
    />
  )
}
