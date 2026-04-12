"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { CheckCircle2, SlidersHorizontal } from "lucide-react"
import type { AppDispatch } from "@/lib/store"
import {
  resumeA2UIChat,
  selectHitlResumeAssistantMessageId,
  selectChatMessages,
} from "@/features/chat/redux"
import type { A2UIClientEvent } from "@/features/chat/redux/chat.types"
import { A2UIResponseTree, isA2UIResponse } from "@/features/chat/components/a2ui-catalog"

const HITL_SCREENER_FORM_ID = "hitl_screener_params"

function findLatestHitlPayload(
  events: A2UIClientEvent[] | undefined
): Record<string, unknown> | null {
  if (!events?.length) return null
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    if (e.event === "hitl_form") {
      const p = e.payload as { interrupt_value?: Record<string, unknown> }
      return p.interrupt_value ?? null
    }
  }
  return null
}

/**
 * Renders the screener HITL form in the wide (Live Preview) panel when the
 * backend emits ``hitl_form``. Submitting dispatches ``resumeA2UIChat``.
 */
interface HitlScreenerPanelProps {
  /** When true, outer chrome is omitted (parent already shows a title bar). */
  embedInPreview?: boolean
}

export default function HitlScreenerPanel({ embedInPreview = false }: HitlScreenerPanelProps) {
  const dispatch = useDispatch<AppDispatch>()
  const messages = useSelector(selectChatMessages)
  const pendingId = useSelector(selectHitlResumeAssistantMessageId)
  const [submitPhase, setSubmitPhase] = useState<"editing" | "sent">("editing")

  useEffect(() => {
    setSubmitPhase("editing")
  }, [pendingId])

  const msg = pendingId ? messages.find((m) => m.id === pendingId) : undefined
  const interrupt = findLatestHitlPayload(msg?.a2uiEvents)
  const rawForm = interrupt?.a2ui_form
  const a2ui = isA2UIResponse(rawForm) ? rawForm : null
  const taskFull = typeof interrupt?.task === "string" ? interrupt.task : null
  const taskHint = taskFull
    ? taskFull.length > 220
      ? `${taskFull.slice(0, 220)}…`
      : taskFull
    : null

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ formId: string; values: Record<string, string> }>
      const { formId, values } = ce.detail ?? {}
      if (formId !== HITL_SCREENER_FORM_ID) return
      setSubmitPhase("sent")
      void dispatch(resumeA2UIChat({ formValues: values }))
    }
    window.addEventListener("a2ui-form-submit", handler as EventListener)
    return () => window.removeEventListener("a2ui-form-submit", handler as EventListener)
  }, [dispatch])

  if (!pendingId || !a2ui) return null

  if (submitPhase === "sent") {
    return (
      <div
        className="flex animate-in fade-in zoom-in-95 duration-300 flex-col gap-3 px-4 py-5"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 h-8 w-8 shrink-0 text-emerald-400"
            strokeWidth={2}
            aria-hidden
          />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-white">Parameters submitted</p>
            <p className="text-xs text-gray-400">Screening is running in the background.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!embedInPreview && (
        <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-4 py-3">
          <SlidersHorizontal className="h-4 w-4 text-[#22d3ee]" />
          <span className="text-sm font-semibold text-white">Screener parameters</span>
          <span className="text-xs text-gray-500">— edit and run screening</span>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {taskHint && (
          <p className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-gray-400">
            <span className="font-medium text-gray-500">Task: </span>
            {taskHint}
          </p>
        )}
        <A2UIResponseTree response={a2ui} />
      </div>
    </div>
  )
}
