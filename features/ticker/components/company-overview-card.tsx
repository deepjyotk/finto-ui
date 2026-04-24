"use client"

import { useState } from "react"
import { ExternalLink, MapPin, Users, Building2, ChevronDown, ChevronUp } from "lucide-react"
import type { TickerInfo } from "../types"

interface Props {
  info: TickerInfo
}

export default function CompanyOverviewCard({ info }: Props) {
  const [expanded, setExpanded] = useState(false)
  const summary = info.longBusinessSummary

  const hasMeta =
    info.sector || info.industry || info.country || info.city ||
    info.fullTimeEmployees != null || info.website

  if (!hasMeta && !summary) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111318]">
      <div className="border-b border-white/[0.07] px-5 py-3">
        <h2 className="text-sm font-bold text-white">Company Overview</h2>
      </div>

      <div className="space-y-4 p-5">
        {/* Metadata chips */}
        {hasMeta && (
          <div className="flex flex-wrap gap-2">
            {info.sector && (
              <span className="flex items-center rounded-full border border-[#22d3ee]/25 bg-[#22d3ee]/10 px-3 py-1 text-xs font-medium text-[#22d3ee]">
                {info.sector}
              </span>
            )}
            {info.industry && (
              <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-400">
                <Building2 className="h-3 w-3 shrink-0" />
                {info.industry}
              </span>
            )}
            {(info.country || info.city) && (
              <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-400">
                <MapPin className="h-3 w-3 shrink-0" />
                {[info.city, info.country].filter(Boolean).join(", ")}
              </span>
            )}
            {info.fullTimeEmployees != null && (
              <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-400">
                <Users className="h-3 w-3 shrink-0" />
                {info.fullTimeEmployees.toLocaleString("en-IN")} employees
              </span>
            )}
            {info.website && (
              <a
                href={info.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-400 transition-colors hover:text-white"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                Website
              </a>
            )}
          </div>
        )}

        {/* Business summary */}
        {summary && (
          <div>
            <p
              className={`text-sm leading-relaxed text-gray-400 ${
                expanded ? "" : "line-clamp-4"
              }`}
            >
              {summary}
            </p>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-[#22d3ee] transition-colors hover:text-[#06b6d4]"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Read more
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
