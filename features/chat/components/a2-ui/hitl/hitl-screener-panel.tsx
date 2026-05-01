"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { CheckCircle2, SlidersHorizontal } from "lucide-react"
import type { AppDispatch } from "@/lib/store"
import {
  resumeA2UIChat,
  selectChatMessages,
  selectHitlResumeAssistantMessageId,
} from "@/features/chat/redux"
import {
  type A2UIActionHandler,
  A2UIOfficialSurface,
  findLatestHitlFormPayload,
  getLiveA2UIFieldValues,
} from "@/features/chat/components/a2-ui/a2ui-catalog"

interface HitlScreenerPanelProps {
  embedInPreview?: boolean
}

export default function HitlScreenerPanel({ embedInPreview = false }: HitlScreenerPanelProps) {
  const dispatch = useDispatch<AppDispatch>()
  const surfaceHostRef = useRef<HTMLDivElement | null>(null)
  const messages = useSelector(selectChatMessages)
  const pendingId = useSelector(selectHitlResumeAssistantMessageId)
  const [submitPhase, setSubmitPhase] = useState<"editing" | "sent">("editing")

  useEffect(() => {
    setSubmitPhase("editing")
  }, [pendingId])

  const message = pendingId ? messages.find((item) => item.id === pendingId) : undefined
  const hitlPayload = useMemo(
    () => findLatestHitlFormPayload(message?.a2uiEvents),
    [message?.a2uiEvents]
  )

  const taskHint = useMemo(() => {
    const task = hitlPayload?.task
    if (!task) return null
    return task.length > 220 ? `${task.slice(0, 220)}…` : task
  }, [hitlPayload?.task])

  const handleAction: A2UIActionHandler = (action, clientDataModel) => {
    if (action.name !== "submit_hitl_form") return

    const actionValues = Object.fromEntries(
      Object.entries(action.context ?? {}).map(([key, value]) => [
        key,
        value == null ? "" : String(value),
      ])
    )
    const syncedFields =
      hitlPayload?.surfaceId
        ? clientDataModel?.surfaces?.[hitlPayload.surfaceId]?.fields
        : undefined
    const liveFields = hitlPayload?.surfaceId
      ? getLiveA2UIFieldValues(hitlPayload.surfaceId)
      : {}
    const domFields = Object.fromEntries(
      Array.from(
        surfaceHostRef.current?.querySelectorAll<HTMLElement>("[data-a2ui-field-name]") ?? []
      ).flatMap((element) => {
        const fieldName = element.dataset.a2uiFieldName
        const input = element.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          "input, textarea"
        )
        return fieldName && input ? [[fieldName, input.value]] : []
      })
    )
    const modelValues =
      syncedFields && typeof syncedFields === "object" && !Array.isArray(syncedFields)
        ? Object.fromEntries(
            Object.entries(syncedFields).map(([key, value]) => [
              key,
              value == null ? "" : String(value),
            ])
          )
        : {}
    const formValues = { ...actionValues, ...modelValues, ...liveFields, ...domFields }

    setSubmitPhase("sent")
    void dispatch(resumeA2UIChat({ formValues }))
  }

  if (!pendingId || !message || !hitlPayload) return null

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
          <span className="text-xs text-gray-500">— review and submit</span>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {taskHint && (
          <p className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-gray-400">
            <span className="font-medium text-gray-500">Task: </span>
            {taskHint}
          </p>
        )}
        <div ref={surfaceHostRef}>
          <A2UIOfficialSurface
            messageKey={message.id}
            events={message.a2uiEvents}
            content={message.content}
            surfaceId={hitlPayload.surfaceId}
            onAction={handleAction}
          />
        </div>
      </div>
    </div>
  )
}
