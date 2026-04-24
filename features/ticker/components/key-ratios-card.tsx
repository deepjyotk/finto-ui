"use client"

import type { KeyRatio } from "../types"

interface Props {
  keyRatios: KeyRatio[]
}

export default function KeyRatiosCard({ keyRatios }: Props) {
  if (!keyRatios.length) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111318]">
      <div className="border-b border-white/[0.07] px-5 py-3">
        <h2 className="text-sm font-bold text-white">Key Ratios &amp; Valuations</h2>
      </div>
      <div className="grid divide-y divide-white/[0.04] sm:grid-cols-2 sm:divide-y-0">
        {keyRatios.map((r, i) => (
          <div
            key={r.label + i}
            className="flex items-center justify-between px-5 py-3 odd:sm:border-r odd:sm:border-white/[0.04]"
          >
            <span className="text-sm text-gray-400">{r.label}</span>
            <span className="tabular-nums text-sm font-semibold text-white">
              {r.value != null ? `${r.value}${r.unit ? " " + r.unit : ""}` : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
