"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { parseA2UIResponse, renderA2UIComponent } from "@/features/chat/components/a2ui-catalog"

const EXAMPLE_JSON = `{
  "type": "a2ui_response",
  "root": ["title", "metrics", "note"],
  "components": {
    "title": {
      "type": "heading",
      "props": { "text": "A2UI preview", "level": 1 }
    },
    "metrics": {
      "type": "metric-card",
      "props": { "label": "Net worth", "value": "₹12,40,000", "change": "+2.3%" }
    },
    "note": {
      "type": "info-box",
      "props": { "text": "Paste your own JSON and click Render preview.", "variant": "info" }
    }
  }
}`

function stripCodeFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim()
}

/** User-facing validation when \`parseA2UIResponse\` rejects the payload. */
function explainA2UIParseFailure(raw: string): string {
  const cleaned = stripCodeFences(raw)
  if (!cleaned) return "Paste JSON (markdown ```json code fences are stripped automatically)."

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid JSON"
    return `JSON parse error: ${msg}`
  }

  if (!parsed || typeof parsed !== "object") {
    return "Root value must be a JSON object."
  }
  const o = parsed as Record<string, unknown>
  if (o.type !== "a2ui_response") {
    return 'Expected `"type": "a2ui_response"`.'
  }
  if (!Array.isArray(o.root)) {
    return 'Expected `"root"` to be an array of component ids.'
  }
  if (typeof o.components !== "object" || o.components === null || Array.isArray(o.components)) {
    return 'Expected `"components"` to be an object mapping ids to component definitions.'
  }
  return "Payload shape looks valid but was not accepted; check for extra constraints or malformed nested props."
}

export default function DevA2UIPage() {
  const [input, setInput] = useState(EXAMPLE_JSON)
  const [submitted, setSubmitted] = useState(EXAMPLE_JSON)

  const parsed = useMemo(() => parseA2UIResponse(submitted), [submitted])
  const parseError = useMemo(() => {
    if (!submitted.trim()) return null
    return parsed ? null : explainA2UIParseFailure(submitted)
  }, [submitted, parsed])

  const onRender = useCallback(() => {
    setSubmitted(input)
  }, [input])

  const onLoadExample = useCallback(() => {
    setInput(EXAMPLE_JSON)
    setSubmitted(EXAMPLE_JSON)
  }, [])

  return (
    <>
      <Header />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-amber-400/90">Dev</p>
            <h1 className="text-xl font-semibold text-white">A2UI playground</h1>
            <p className="mt-1 text-sm text-gray-400">
              Paste <code className="rounded bg-white/10 px-1 py-0.5 text-xs">a2ui_response</code> JSON and
              render it with the same catalog as chat.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="border-white/15 bg-white/5" asChild>
              <Link href="/chat">Back to chat</Link>
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={onLoadExample}>
              Reset example
            </Button>
            <Button type="button" size="sm" onClick={onRender}>
              Render preview
            </Button>
          </div>
        </div>

        <div className="grid flex-1 gap-4 lg:grid-cols-2 lg:gap-6 min-h-[min(70vh,720px)]">
          <div className="flex min-h-[280px] flex-col gap-2 lg:min-h-0">
            <label htmlFor="a2ui-json" className="text-sm font-medium text-gray-300">
              JSON input
            </label>
            <textarea
              id="a2ui-json"
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={cn(
                "min-h-[320px] flex-1 resize-y rounded-lg border border-white/10 bg-[#0f1419] p-3 font-mono text-sm text-gray-100",
                "placeholder:text-gray-600 focus:border-[var(--color-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--color-secondary)]/30"
              )}
              placeholder='{ "type": "a2ui_response", "root": [...], "components": { ... } }'
            />
          </div>

          <div className="flex min-h-[280px] flex-col gap-2 lg:min-h-0">
            <span className="text-sm font-medium text-gray-300">Preview</span>
            <div
              className={cn(
                "flex-1 overflow-auto rounded-lg border border-white/10 bg-[var(--chat-surface)]/90 p-4 shadow-inner backdrop-blur",
                parseError && "border-amber-500/30"
              )}
            >
              {parsed ? (
                <div className="space-y-3">
                  {parsed.root.map((id) => {
                    const component = parsed.components[id]
                    if (!component) return null
                    return renderA2UIComponent(id, component, parsed.components)
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  {parseError ? (
                    <p className="rounded-md border border-amber-500/25 bg-amber-950/20 px-3 py-2 text-amber-100/90">
                      {parseError}
                    </p>
                  ) : (
                    <p>Click &quot;Render preview&quot; after editing.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
