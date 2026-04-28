"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  A2UIOfficialSurface,
  A2UI_MAIN_SURFACE_ID,
  A2UI_STORED_DOCUMENT_TYPE,
  FINANCE_CHAT_CATALOG_ID,
} from "@/features/chat/components/a2ui-catalog"
import type { A2UIClientEvent } from "@/features/chat/redux/chat.types"
import type { A2uiMessage } from "@a2ui/web_core/v0_9"

const EXAMPLE_MESSAGES = [
  {
    version: "v0.9",
    createSurface: {
      surfaceId: A2UI_MAIN_SURFACE_ID,
      catalogId: FINANCE_CHAT_CATALOG_ID,
    },
  },
  {
    version: "v0.9",
    updateComponents: {
      surfaceId: A2UI_MAIN_SURFACE_ID,
      components: [
        {
          id: "root",
          component: "Column",
          children: ["title", "summary_row", "note"],
        },
        {
          id: "title",
          component: "Text",
          text: "A2UI v0.9 preview",
          variant: "h2",
        },
        {
          id: "summary_row",
          component: "Row",
          children: ["net_worth", "cash"],
        },
        {
          id: "net_worth",
          component: "MetricCard",
          label: "Net worth",
          value: { path: "/metrics/netWorth" },
          change: "+2.3%",
        },
        {
          id: "cash",
          component: "MetricCard",
          label: "Available cash",
          value: { path: "/metrics/cash" },
        },
        {
          id: "note",
          component: "InfoBox",
          text: "This playground now renders official A2UI v0.9 messages through MessageProcessor and A2uiSurface.",
          variant: "info",
        },
      ],
    },
  },
  {
    version: "v0.9",
    updateDataModel: {
      surfaceId: A2UI_MAIN_SURFACE_ID,
      path: "/",
      value: {
        metrics: {
          netWorth: "₹12,40,000.00",
          cash: "₹85,000.00",
        },
      },
    },
  },
]

const EXAMPLE_JSON = JSON.stringify({ messages: EXAMPLE_MESSAGES }, null, 2)

function stripCodeFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim()
}

function parseOfficialMessages(raw: string): { messages: A2uiMessage[]; error?: string } {
  const cleaned = stripCodeFences(raw)
  if (!cleaned) return { messages: [], error: "Paste an official A2UI v0.9 message array or { messages: [...] }." }

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid JSON"
    return { messages: [], error: `JSON parse error: ${msg}` }
  }

  const messages = Array.isArray(parsed)
    ? parsed
    : parsed &&
        typeof parsed === "object" &&
        Array.isArray((parsed as { messages?: unknown }).messages)
      ? (parsed as { messages: unknown[] }).messages
      : null

  if (!messages) return { messages: [], error: "Expected an A2UI message array or an object with a messages array." }
  if (!messages.every((message) => message && typeof message === "object" && (message as { version?: unknown }).version === "v0.9")) {
    return { messages: [], error: 'Every message must be an official A2UI v0.9 object with `version: "v0.9"`.' }
  }

  return { messages: messages as A2uiMessage[] }
}

function buildStoredDocument(messages: A2uiMessage[]): string {
  return JSON.stringify({
    type: A2UI_STORED_DOCUMENT_TYPE,
    mainSurfaceId: A2UI_MAIN_SURFACE_ID,
    messages,
  })
}

export default function DevA2UIPage() {
  const [input, setInput] = useState(EXAMPLE_JSON)
  const [submitted, setSubmitted] = useState(EXAMPLE_JSON)

  const parsed = useMemo(() => parseOfficialMessages(submitted), [submitted])
  const content = useMemo(
    () => (parsed.messages.length ? buildStoredDocument(parsed.messages) : ""),
    [parsed.messages]
  )
  const events = useMemo<A2UIClientEvent[]>(() => [], [])

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
              Paste official v0.9 messages and render them through <code className="rounded bg-white/10 px-1 py-0.5 text-xs">MessageProcessor</code>.
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

        <div className="grid min-h-[min(70vh,720px)] flex-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <div className="flex min-h-[280px] flex-col gap-2 lg:min-h-0">
            <label htmlFor="a2ui-json" className="text-sm font-medium text-gray-300">
              Official A2UI messages
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
              placeholder='{ "messages": [{ "version": "v0.9", "createSurface": { ... } }] }'
            />
          </div>

          <div className="flex min-h-[280px] flex-col gap-2 lg:min-h-0">
            <span className="text-sm font-medium text-gray-300">Preview</span>
            <div
              className={cn(
                "flex-1 overflow-auto rounded-lg border border-white/10 bg-[var(--chat-surface)]/90 p-4 shadow-inner backdrop-blur",
                parsed.error && "border-amber-500/30"
              )}
            >
              {parsed.error ? (
                <p className="rounded-md border border-amber-500/25 bg-amber-950/20 px-3 py-2 text-sm text-amber-100/90">
                  {parsed.error}
                </p>
              ) : (
                <A2UIOfficialSurface
                  messageKey={submitted}
                  events={events}
                  content={content}
                  surfaceId={A2UI_MAIN_SURFACE_ID}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
