"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import {
  ArrowUp,
  Loader2,
  Paperclip,
  ChevronDown,
  Bot,
  MessageSquare,
  Check,
  BrainCircuit,
  Sparkles,
  Search,
  Infinity,
  Wand2,
  Square,
  type LucideIcon,
} from "lucide-react"
import type { ChatModeItem, LLMModelItem } from "@/features/chat/apis/chat-api"

/** Must match backend ``LLMModel.Auto`` / metadata ``id`` for Auto. */
export const MODEL_AUTO_ID = "auto"

const MODE_ICON_MAP: Record<string, LucideIcon> = {
  agent: Bot,
  ask: MessageSquare,
}

const MODEL_ICON_MAP: Record<string, LucideIcon> = {
  [MODEL_AUTO_ID]: Wand2,
  "gpt-4.1": BrainCircuit,
  "gpt-5": Sparkles,
}

const DEFAULT_ICON: LucideIcon = BrainCircuit

interface UserTextEnterProps {
  onSendMessage: (message: string, modelId: string) => Promise<void>
  /** True while a reply is streaming; shows stop control when `onStopSend` is set. */
  disabled?: boolean
  /** Stops the in-flight `/api/thesys/chat` stream (AbortController). */
  onStopSend?: () => void
  sessionId?: string | null
  chatModes: ChatModeItem[]
  llmModels: LLMModelItem[]
}

export default function UserTextEnter({
  onSendMessage,
  disabled = false,
  onStopSend,
  sessionId,
  chatModes,
  llmModels,
}: UserTextEnterProps) {
  const [input, setInput] = useState("")
  const [modeSelection, setModeSelection] = useState<string>(chatModes[0]?.id ?? "")
  const [selectedModel, setSelectedModel] = useState<string>(MODEL_AUTO_ID)
  const [modeOpen, setModeOpen] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const [modelSearch, setModelSearch] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modelSearchRef = useRef<HTMLInputElement>(null)

  const filteredModels = useMemo(
    () => llmModels.filter((m) => m.label.toLowerCase().includes(modelSearch.toLowerCase())),
    [llmModels, modelSearch],
  )

  useEffect(() => {
    if (llmModels.length === 0) return
    if (!llmModels.some((m) => m.id === selectedModel)) {
      setSelectedModel(
        llmModels.find((m) => m.id === MODEL_AUTO_ID)?.id ?? llmModels[0]!.id,
      )
    }
  }, [llmModels, selectedModel])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [input])

  const handleSend = useCallback(async () => {
    if (!input.trim() || disabled) return
    const message = input.trim()
    setInput("")
    await onSendMessage(message, selectedModel)
  }, [input, disabled, onSendMessage, selectedModel])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const currentModel =
    llmModels.find((m) => m.id === selectedModel) ?? llmModels[0]
  const canSend = input.trim().length > 0 && !disabled && !!sessionId
  const explicitMode = chatModes.find((m) => m.id === modeSelection) ?? chatModes[0]

  return (
    <div className="shrink-0 px-3 pb-3 pt-1">
      <div className="group rounded-2xl border border-white/[0.08] bg-[#1e1f2a] shadow-lg transition-colors duration-200 focus-within:border-white/[0.16]">
        {/* Textarea zone */}
        <div className="px-3.5 pt-3 pb-1">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI..."
            disabled={disabled || !sessionId}
            className="min-h-[36px] max-h-[160px] resize-none border-0 bg-transparent dark:bg-transparent p-0 text-[13px] leading-[1.45] text-white/90 shadow-none placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
            rows={1}
          />
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-2.5 pb-2 pt-1">
          <div className="flex min-w-0 items-center gap-1">
            {/* Mode: Agent / Ask only (ss3 pill) */}
            <Popover open={modeOpen} onOpenChange={setModeOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-7 max-w-[min(120px,40vw)] items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] pl-2 pr-2.5 text-[12px] font-medium text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white/90"
                >
                  <Infinity className="h-3.5 w-3.5 shrink-0 text-white/45" strokeWidth={2} />
                  <span className="truncate">{explicitMode?.label}</span>
                  <ChevronDown className="h-3 w-3 shrink-0 opacity-45" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-52 rounded-xl border border-white/[0.08] bg-[#1a1b26] p-1.5 shadow-2xl"
              >
                {chatModes.map((mode) => {
                  const Icon = MODE_ICON_MAP[mode.id] ?? DEFAULT_ICON
                  const active = mode.id === modeSelection
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setModeSelection(mode.id)
                        setModeOpen(false)
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/[0.06]"
                    >
                      <Icon className={`h-4 w-4 ${active ? "text-white/75" : "text-white/35"}`} />
                      <span
                        className={`flex-1 text-[13px] font-medium ${active ? "text-white/90" : "text-white/55"}`}
                      >
                        {mode.label}
                      </span>
                      {active && <Check className="h-3.5 w-3.5 shrink-0 text-white/45" />}
                    </button>
                  )
                })}
              </PopoverContent>
            </Popover>

            <div className="mx-0.5 h-3.5 w-px shrink-0 bg-white/[0.06]" />

            {/* Model: Auto + models — search + list */}
            <Popover
              open={modelOpen}
              onOpenChange={(open) => {
                setModelOpen(open)
                if (!open) setModelSearch("")
              }}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-7 max-w-[min(160px,46vw)] items-center gap-1 truncate rounded-lg px-2 text-[12px] font-medium text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white/65"
                >
                  <span className="truncate">{currentModel?.label ?? "Model"}</span>
                  <ChevronDown className="h-3 w-3 shrink-0 opacity-40" />
                </button>
              </PopoverTrigger>

              <PopoverContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-56 rounded-xl border border-white/[0.08] bg-[#1a1b26] p-0 shadow-2xl"
                onOpenAutoFocus={(e) => {
                  e.preventDefault()
                  modelSearchRef.current?.focus()
                }}
              >
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <Search className="h-3.5 w-3.5 shrink-0 text-white/25" />
                  <input
                    ref={modelSearchRef}
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder="Search models"
                    className="w-full bg-transparent text-[12px] text-white/70 placeholder:text-white/25 outline-none"
                  />
                </div>
                <div className="border-t border-white/[0.05]" />
                <div className="max-h-[220px] overflow-y-auto p-1.5">
                  {filteredModels.length === 0 ? (
                    <div className="px-2.5 py-3 text-center text-[12px] text-white/25">
                      No models found
                    </div>
                  ) : (
                    filteredModels.map((model) => {
                      const Icon = MODEL_ICON_MAP[model.id] ?? DEFAULT_ICON
                      const isActive = model.id === selectedModel
                      return (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => {
                            setSelectedModel(model.id)
                            setModelOpen(false)
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-white/[0.06]"
                        >
                          <Icon
                            className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-white/70" : "text-white/25"}`}
                          />
                          <span
                            className={`flex-1 truncate text-[12px] font-medium ${isActive ? "text-white/90" : "text-white/45"}`}
                          >
                            {model.label}
                          </span>
                          {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-white/50" />}
                        </button>
                      )
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Right: attach + send */}
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/50"
              title="Attach file"
            >
              <Paperclip className="h-3.5 w-3.5" />
            </button>

            {disabled && onStopSend ? (
              <button
                type="button"
                onClick={onStopSend}
                title="Stop generating"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.12] text-white/90 transition-all duration-150 hover:bg-red-500/25 hover:text-white"
              >
                <Square className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.08] text-white/50 transition-all duration-150 hover:bg-white/[0.14] hover:text-white disabled:opacity-30 disabled:hover:bg-white/[0.08] disabled:hover:text-white/50"
              >
                {disabled ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
