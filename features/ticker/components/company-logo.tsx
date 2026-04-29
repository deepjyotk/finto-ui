"use client"

/**
 * CompanyLogo
 *
 * Resolves a company logo by probing sources in priority order:
 *   1. Cloudflare R2 CDN  (.svg)
 *   2. Cloudflare R2 CDN  (.png)
 *   3. GCS bucket         (.svg)
 *   4. GCS bucket         (.png)
 *   5. Initials fallback  (no network)
 *
 * The resolved URL (or "failed" status) is stored in Redux so that
 * subsequent renders / page-navigations skip the probing step.
 */

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { setLogoResolved, setLogoFailed, selectLogo } from "../redux"

// ── Env-driven base URLs ──────────────────────────────────────────────────────

const CDN_BASE =
  process.env.NEXT_PUBLIC_CDN_BASE_URL?.replace(/\/$/, "") ??
  "https://pub-02ae21b71a13498f94e99ef653d36c8a.r2.dev"

const GCS_BASE =
  process.env.NEXT_PUBLIC_GCS_LOGOS_BASE_URL?.replace(/\/$/, "") ??
  "https://storage.googleapis.com/finto-logos"

function buildCandidates(symbol: string): Array<{ url: string; source: "cdn" | "gcs" }> {
  const s = symbol.toUpperCase()
  return [
    { url: `${CDN_BASE}/${s}.svg`, source: "cdn" },
    { url: `${CDN_BASE}/${s}.png`, source: "cdn" },
    { url: `${GCS_BASE}/${s}.svg`, source: "gcs" },
    { url: `${GCS_BASE}/${s}.png`, source: "gcs" },
  ]
}

// ── Initials fallback ─────────────────────────────────────────────────────────

const PALETTE = [
  "bg-violet-600", "bg-cyan-600", "bg-emerald-600",
  "bg-orange-600", "bg-rose-600", "bg-blue-600",
]

function pickColor(symbol: string) {
  let hash = 0
  for (const ch of symbol) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

function Initials({ symbol, size }: { symbol: string; size: number }) {
  const initials = symbol.slice(0, 2).toUpperCase()
  const bg = pickColor(symbol)
  return (
    <span
      className={`flex items-center justify-center rounded-full font-bold text-white ${bg}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CompanyLogoProps {
  symbol: string
  /** Rendered size in pixels (width & height). Default: 40 */
  size?: number
  className?: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CompanyLogo({ symbol, size = 40, className }: CompanyLogoProps) {
  const dispatch = useAppDispatch()
  const cached = useAppSelector((s) => selectLogo(s, symbol))

  // Which candidate index we're currently trying (only used during probing)
  const candidates = useRef(buildCandidates(symbol))
  const [candidateIdx, setCandidateIdx] = useState(0)
  const [probing, setProbing] = useState(cached === undefined)

  // Re-initialise when symbol changes
  useEffect(() => {
    candidates.current = buildCandidates(symbol)
    setCandidateIdx(0)
    setProbing(cached === undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol])

  // ── Already resolved (from Redux cache) ──────────────────────────────────
  if (!probing && cached) {
    if (cached.status === "failed" || !cached.resolvedUrl) {
      return <Initials symbol={symbol} size={size} />
    }
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full ${className ?? ""}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={cached.resolvedUrl}
          alt={`${symbol} logo`}
          fill
          className="object-contain"
          unoptimized
        />
      </div>
    )
  }

  // ── Probing ───────────────────────────────────────────────────────────────
  const current = candidates.current[candidateIdx]

  if (!current) {
    // All candidates exhausted
    if (probing) {
      dispatch(setLogoFailed(symbol))
      setProbing(false)
    }
    return <Initials symbol={symbol} size={size} />
  }

  const handleLoad = () => {
    dispatch(setLogoResolved({ symbol, url: current.url, source: current.source }))
    setProbing(false)
  }

  const handleError = () => {
    const next = candidateIdx + 1
    if (next >= candidates.current.length) {
      dispatch(setLogoFailed(symbol))
      setProbing(false)
    } else {
      setCandidateIdx(next)
    }
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={current.url}
        src={current.url}
        alt={`${symbol} logo`}
        width={size}
        height={size}
        className="h-full w-full object-contain"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}
