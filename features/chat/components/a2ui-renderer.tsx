"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronRight } from "lucide-react"
import { A2uiSurface, MarkdownContext } from "@a2ui/react/v0_9"
import { renderMarkdown } from "@a2ui/markdown-it"
import { cn } from "@/lib/utils"
import type {
  A2UIClientEvent,
  A2UIErrorPayload,
  A2UIStepCompletePayload,
  A2UIStepStartPayload,
  A2UIToolCallPayload,
  A2UIToolResultPayload,
} from "@/features/chat/redux/chat.types"
import {
  A2UI_MAIN_SURFACE_ID,
  parseStoredA2UIDocument,
  renderMarkdownFallback,
  useA2UIMessageProcessor,
} from "@/features/chat/components/a2-ui/a2ui-catalog"

function isStepStart(
  event: A2UIClientEvent
): event is A2UIClientEvent & { payload: A2UIStepStartPayload } {
  return event.event === "step_start"
}

function isStepComplete(
  event: A2UIClientEvent
): event is A2UIClientEvent & { payload: A2UIStepCompletePayload } {
  return event.event === "step_complete"
}

function isToolCall(
  event: A2UIClientEvent
): event is A2UIClientEvent & { payload: A2UIToolCallPayload } {
  return event.event === "tool_call"
}

function isToolResult(
  event: A2UIClientEvent
): event is A2UIClientEvent & { payload: A2UIToolResultPayload } {
  return event.event === "tool_result"
}

function isError(
  event: A2UIClientEvent
): event is A2UIClientEvent & { payload: A2UIErrorPayload } {
  return event.event === "error"
}

interface StepState {
  stepName: string
  title: string
  description?: string
  status: "running" | "done" | "error"
  toolCalls: ToolCallState[]
}

interface ToolCallState {
  toolName: string
  displayName: string
  inputSummary?: string
  outputSummary?: string
  status: "pending" | "success" | "error"
}

function buildSteps(events: A2UIClientEvent[]): StepState[] {
  const stepsMap = new Map<string, StepState>()
  const stepsOrder: string[] = []

  for (const event of events) {
    if (isStepStart(event)) {
      const payload = event.payload
      if (!stepsMap.has(payload.step_name)) {
        stepsOrder.push(payload.step_name)
        stepsMap.set(payload.step_name, {
          stepName: payload.step_name,
          title: payload.title,
          description: payload.description,
          status: "running",
          toolCalls: [],
        })
      }
    } else if (isStepComplete(event)) {
      const step = stepsMap.get(event.payload.step_name)
      if (step) step.status = event.payload.status === "error" ? "error" : "done"
    } else if (isToolCall(event)) {
      const step =
        stepsMap.get(event.payload.step_name) ?? stepsMap.get(stepsOrder.at(-1) ?? "")
      if (step) {
        step.toolCalls.push({
          toolName: event.payload.tool_name,
          displayName: event.payload.display_name,
          inputSummary: event.payload.input_summary,
          status: "pending",
        })
      }
    } else if (isToolResult(event)) {
      const step =
        stepsMap.get(event.payload.step_name) ?? stepsMap.get(stepsOrder.at(-1) ?? "")
      if (step) {
        const toolCall = step.toolCalls
          .slice()
          .reverse()
          .find((item) => item.toolName === event.payload.tool_name && item.status === "pending")

        if (toolCall) {
          toolCall.outputSummary = event.payload.output_summary
          toolCall.status = event.payload.status === "error" ? "error" : "success"
        }
      }
    }
  }

  return stepsOrder.map((name) => stepsMap.get(name)!).filter(Boolean)
}

function extractFinalContent(events: A2UIClientEvent[]): string {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i]
    if (event.event === "message_complete") {
      const content = (event.payload as { content: string }).content
      if (content.length > 0) return content
      break
    }
  }

  const chunks: string[] = []
  for (const event of events) {
    if (event.event === "message_chunk") {
      chunks.push((event.payload as { chunk: string }).chunk)
    }
  }
  return chunks.length ? chunks.join("") : ""
}

function extractError(events: A2UIClientEvent[]): string | null {
  const error = events.find(isError)
  return error ? error.payload.message : null
}

function StatusDot({ status }: { status: "running" | "done" | "error" }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 flex-shrink-0 rounded-full",
        status === "running" && "animate-pulse bg-[var(--color-secondary)]",
        status === "done" && "bg-emerald-400",
        status === "error" && "bg-red-400"
      )}
    />
  )
}

function ToolAccordion({ tool }: { tool: ToolCallState }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-1 rounded-md border border-white/5 bg-white/[0.02]">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-300 transition-colors hover:text-white"
      >
        <span
          className={cn(
            "inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full",
            tool.status === "pending" && "animate-pulse bg-amber-400",
            tool.status === "success" && "bg-emerald-400",
            tool.status === "error" && "bg-red-400"
          )}
        />
        <span className="flex-1 font-medium">{tool.displayName}</span>
        <svg
          className={cn("h-3 w-3 text-gray-500 transition-transform", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="space-y-1.5 border-t border-white/5 px-3 py-2 text-xs text-gray-400">
          {tool.inputSummary && (
            <div>
              <span className="text-[10px] uppercase tracking-wide text-gray-500">Input</span>
              <p className="mt-0.5 break-words text-gray-300">{tool.inputSummary}</p>
            </div>
          )}
          {tool.outputSummary && (
            <div>
              <span className="text-[10px] uppercase tracking-wide text-gray-500">Output</span>
              <p className="mt-0.5 break-words text-gray-300">{tool.outputSummary}</p>
            </div>
          )}
          {!tool.inputSummary && !tool.outputSummary && (
            <p className="italic text-gray-500">No details available</p>
          )}
        </div>
      )}
    </div>
  )
}

function chainSummaryLine(steps: StepState[], isStreaming: boolean): string {
  if (steps.length === 0) return ""
  const running = steps.find((step) => step.status === "running")
  if (isStreaming && running) return running.title
  if (isStreaming) return steps[steps.length - 1]?.title ?? "…"
  return `${steps.length} step${steps.length === 1 ? "" : "s"}`
}

function ChainOfThoughtSection({ steps, isStreaming }: { steps: StepState[]; isStreaming: boolean }) {
  const [open, setOpen] = useState(isStreaming)

  useEffect(() => {
    if (isStreaming) setOpen(true)
    else setOpen(false)
  }, [isStreaming])

  const summary = chainSummaryLine(steps, isStreaming)

  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 flex-shrink-0 text-gray-500 transition-transform duration-200",
            open && "rotate-90"
          )}
          aria-hidden
        />
        <span className="text-sm font-medium text-gray-200">Reasoning</span>
        <span className="ml-auto min-w-0 truncate pl-2 text-xs text-gray-500">{summary}</span>
      </button>
      {open && (
        <div className="border-t border-white/[0.06] px-2 pb-2 pt-1.5">
          <div className="space-y-1.5">
            {steps.map((step) => (
              <StepCard key={step.stepName} step={step} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StepCard({ step }: { step: StepState }) {
  const [expanded, setExpanded] = useState(false)
  const hasTools = step.toolCalls.length > 0

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5",
        step.status === "running" && "border-white/10 bg-white/[0.03]",
        step.status === "done" && "border-emerald-400/20 bg-emerald-950/10",
        step.status === "error" && "border-red-400/20 bg-red-950/10"
      )}
    >
      <div
        className={cn("flex items-center gap-2", hasTools && "cursor-pointer")}
        onClick={() => hasTools && setExpanded((value) => !value)}
      >
        <StatusDot status={step.status} />
        <span className="flex-1 text-sm font-medium text-gray-200">{step.title}</span>
        {step.description && (
          <span className="hidden text-xs text-gray-500 sm:block">{step.description}</span>
        )}
        {hasTools && (
          <svg
            className={cn("h-3 w-3 text-gray-500 transition-transform", expanded && "rotate-180")}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </div>
      {expanded && hasTools && (
        <div className="mt-2 space-y-1">
          {step.toolCalls.map((tool, index) => (
            <ToolAccordion key={`${tool.toolName}-${index}`} tool={tool} />
          ))}
        </div>
      )}
    </div>
  )
}

interface A2UIRendererProps {
  messageId: string
  events?: A2UIClientEvent[]
  content?: string
  isStreaming?: boolean
}

export default function A2UIRenderer({
  messageId,
  events = [],
  isStreaming = false,
  content: storedContent,
}: A2UIRendererProps) {
  const steps = buildSteps(events)
  const streamedContent = extractFinalContent(events)
  const finalContent = streamedContent || (!isStreaming ? (storedContent ?? "") : "")
  const errorMessage = extractError(events)

  const { getSurface } = useA2UIMessageProcessor({
    messageKey: messageId,
    events,
    content: storedContent,
  })

  const mainSurface = getSurface(A2UI_MAIN_SURFACE_ID)
  const storedDocument = useMemo(() => parseStoredA2UIDocument(finalContent), [finalContent])
  const hasRenderableSurface = !!mainSurface || !!storedDocument
  const hasPlainFallback = !hasRenderableSurface && finalContent.trim().length > 0
  const hasSteps = steps.length > 0

  if (!hasSteps && !hasRenderableSurface && !hasPlainFallback && !errorMessage) return null

  return (
    <div className="space-y-3">
      {hasSteps && <ChainOfThoughtSection steps={steps} isStreaming={isStreaming} />}

      {isStreaming && !hasRenderableSurface && !hasPlainFallback && !hasSteps && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-secondary)]" />
          <span>Processing…</span>
        </div>
      )}

      {(hasRenderableSurface || hasPlainFallback || isStreaming) && (
        <div className={cn(hasSteps && "border-t border-white/5 pt-3")}>
          {mainSurface ? (
            <div className="a2ui-dark">
              <MarkdownContext.Provider value={renderMarkdown}>
                <A2uiSurface surface={mainSurface} />
              </MarkdownContext.Provider>
            </div>
          ) : isStreaming && !hasPlainFallback ? (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-secondary)]" />
              <span className="tracking-wide">Generating answer…</span>
            </div>
          ) : hasPlainFallback ? (
            renderMarkdownFallback(finalContent)
          ) : null}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-md border border-red-400/20 bg-red-950/10 px-3 py-2 text-sm text-red-300">
          <svg
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M5.07 19h13.86A2 2 0 0021 16.14L14.07 5a2 2 0 00-3.14 0L4.07 16.14A2 2 0 005.07 19z"
            />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}
