"use client"

import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import { ChevronRight } from "lucide-react"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import type {
  A2UIClientEvent,
  A2UIStepStartPayload,
  A2UIStepCompletePayload,
  A2UIToolCallPayload,
  A2UIToolResultPayload,
  A2UIErrorPayload,
} from "@/features/chat/redux/chat.types"
import {
  parseA2UIResponse,
  renderA2UIComponent,
} from "@/features/chat/components/a2ui-catalog"

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isStepStart(e: A2UIClientEvent): e is A2UIClientEvent & { payload: A2UIStepStartPayload } {
  return e.event === "step_start"
}
function isStepComplete(
  e: A2UIClientEvent
): e is A2UIClientEvent & { payload: A2UIStepCompletePayload } {
  return e.event === "step_complete"
}
function isToolCall(e: A2UIClientEvent): e is A2UIClientEvent & { payload: A2UIToolCallPayload } {
  return e.event === "tool_call"
}
function isToolResult(
  e: A2UIClientEvent
): e is A2UIClientEvent & { payload: A2UIToolResultPayload } {
  return e.event === "tool_result"
}
function isError(e: A2UIClientEvent): e is A2UIClientEvent & { payload: A2UIErrorPayload } {
  return e.event === "error"
}

// ---------------------------------------------------------------------------
// Derive step/tool state from flat event list
// ---------------------------------------------------------------------------

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

  for (const evt of events) {
    if (isStepStart(evt)) {
      const p = evt.payload
      if (!stepsMap.has(p.step_name)) {
        stepsOrder.push(p.step_name)
        stepsMap.set(p.step_name, {
          stepName: p.step_name,
          title: p.title,
          description: p.description,
          status: "running",
          toolCalls: [],
        })
      }
    } else if (isStepComplete(evt)) {
      const s = stepsMap.get(evt.payload.step_name)
      if (s) s.status = evt.payload.status === "error" ? "error" : "done"
    } else if (isToolCall(evt)) {
      const step =
        stepsMap.get(evt.payload.step_name) ?? stepsMap.get(stepsOrder.at(-1) ?? "")
      if (step) {
        step.toolCalls.push({
          toolName: evt.payload.tool_name,
          displayName: evt.payload.display_name,
          inputSummary: evt.payload.input_summary,
          status: "pending",
        })
      }
    } else if (isToolResult(evt)) {
      const step =
        stepsMap.get(evt.payload.step_name) ?? stepsMap.get(stepsOrder.at(-1) ?? "")
      if (step) {
        const tc = step.toolCalls
          .slice()
          .reverse()
          .find((t) => t.toolName === evt.payload.tool_name && t.status === "pending")
        if (tc) {
          tc.outputSummary = evt.payload.output_summary
          tc.status = evt.payload.status === "error" ? "error" : "success"
        }
      }
    }
  }
  return stepsOrder.map((n) => stepsMap.get(n)!).filter(Boolean)
}

function extractFinalContent(events: A2UIClientEvent[]): string {
  // Prefer the terminal message_complete payload when present — it is the
  // server's full assembled answer. Joining message_chunk deltas is used only
  // while streaming or if no complete event arrived.
  for (let i = events.length - 1; i >= 0; i--) {
    const evt = events[i]
    if (evt.event === "message_complete") {
      const content = (evt.payload as { content: string }).content
      if (content.length > 0) return content
      break
    }
  }
  const chunks: string[] = []
  for (const evt of events) {
    if (evt.event === "message_chunk") {
      chunks.push((evt.payload as { chunk: string }).chunk)
    }
  }
  return chunks.length ? chunks.join("") : ""
}

function extractError(events: A2UIClientEvent[]): string | null {
  const err = events.find(isError)
  return err ? (err.payload as A2UIErrorPayload).message : null
}

// ---------------------------------------------------------------------------
// Step timeline sub-components
// ---------------------------------------------------------------------------

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
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-300 hover:text-white transition-colors"
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
        <div className="border-t border-white/5 px-3 py-2 space-y-1.5 text-xs text-gray-400">
          {tool.inputSummary && (
            <div>
              <span className="text-gray-500 uppercase tracking-wide text-[10px]">Input</span>
              <p className="mt-0.5 text-gray-300 break-words">{tool.inputSummary}</p>
            </div>
          )}
          {tool.outputSummary && (
            <div>
              <span className="text-gray-500 uppercase tracking-wide text-[10px]">Output</span>
              <p className="mt-0.5 text-gray-300 break-words">{tool.outputSummary}</p>
            </div>
          )}
          {!tool.inputSummary && !tool.outputSummary && (
            <p className="text-gray-500 italic">No details available</p>
          )}
        </div>
      )}
    </div>
  )
}

function chainSummaryLine(steps: StepState[], isStreaming: boolean): string {
  if (steps.length === 0) return ""
  const running = steps.find((s) => s.status === "running")
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
        onClick={() => setOpen((v) => !v)}
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
        onClick={() => hasTools && setExpanded((v) => !v)}
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
          {step.toolCalls.map((tc, i) => (
            <ToolAccordion key={`${tc.toolName}-${i}`} tool={tc} />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// A2UI component tree renderer
// ---------------------------------------------------------------------------

function A2UIComponentTree({ content }: { content: string }) {
  const response = parseA2UIResponse(content)

  if (!response) {
    // Fallback: plain Markdown (handles non-JSON responses gracefully)
    return (
      <div className="prose prose-invert prose-sm max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-p:text-gray-200 prose-a:text-cyan-400 prose-strong:text-white prose-table:text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {response.root.map((id) => {
        const component = response.components[id]
        if (!component) return null
        return renderA2UIComponent(id, component, response.components)
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

interface A2UIRendererProps {
  events?: A2UIClientEvent[]
  /** Stored message content (A2UI JSON or plain text) — used as fallback on page reload
   *  when the live event stream is no longer available. */
  content?: string
  isStreaming?: boolean
}

export default function A2UIRenderer({ events = [], isStreaming = false, content: storedContent }: A2UIRendererProps) {
  const steps = buildSteps(events)
  const streamedContent = extractFinalContent(events)
  // On reload there are no events — fall back to the persisted message content
  const finalContent = streamedContent || (!isStreaming ? (storedContent ?? "") : "")
  const errorMessage = extractError(events)

  const hasSteps = steps.length > 0
  const hasAnswer = finalContent.trim().length > 0

  if (!hasSteps && !hasAnswer && !errorMessage) return null

  return (
    <div className="space-y-3">
      {/* Step timeline — collapsible (Cursor / Claude-style) */}
      {hasSteps && (
        <ChainOfThoughtSection steps={steps} isStreaming={isStreaming} />
      )}

      {/* Streaming indicator while no answer content yet */}
      {isStreaming && !hasAnswer && !hasSteps && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-secondary)]" />
          <span>Processing…</span>
        </div>
      )}

      {/* Final answer — A2UI component tree (with Markdown fallback) */}
      {(hasAnswer || isStreaming) && (
        <div className={cn(hasSteps && "border-t border-white/5 pt-3")}>
          {isStreaming && !hasAnswer ? (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-secondary)]" />
              <span className="tracking-wide">Generating answer…</span>
            </div>
          ) : (
            <A2UIComponentTree content={finalContent} />
          )}
        </div>
      )}

      {/* Error state */}
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
