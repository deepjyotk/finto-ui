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
  type LucideIcon,
} from "lucide-react"
import type { ChatModeItem, LLMModelItem } from "@/features/chat/apis/chat-api"

const MODE_ICON_MAP: Record<string, LucideIcon> = {
  agent: Bot,
  ask: MessageSquare,
}

const MODEL_ICON_MAP: Record<string, LucideIcon> = {
  "gpt-4.1": BrainCircuit,
  "gpt-5": Sparkles,
}

const DEFAULT_ICON: LucideIcon = BrainCircuit

interface UserTextEnterProps {
  onSendMessage: (message: string) => Promise<void>
  disabled?: boolean
  sessionId?: string | null
  chatModes: ChatModeItem[]
  llmModels: LLMModelItem[]
}

export default function UserTextEnter({
  onSendMessage,
  disabled = false,
  sessionId,
  chatModes,
  llmModels,
}: UserTextEnterProps) {
  const [input, setInput] = useState("")
  const [selectedMode, setSelectedMode] = useState<string>(chatModes[0]?.id ?? "")
  const [selectedModel, setSelectedModel] = useState<string>(llmModels[0]?.id ?? "")
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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [input])

  const handleSend = useCallback(async () => {
    if (!input.trim() || disabled) return
    const message = input.trim()
    setInput("")
    await onSendMessage(message)
  }, [input, disabled, onSendMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const currentMode = chatModes.find((m) => m.id === selectedMode) ?? chatModes[0]
  const currentModel = llmModels.find((m) => m.id === selectedModel) ?? llmModels[0]
  const canSend = input.trim().length > 0 && !disabled && !!sessionId
  const ModeIcon = currentMode ? (MODE_ICON_MAP[currentMode.id] ?? DEFAULT_ICON) : Bot

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
          {/* Left: mode + model selectors */}
          <div className="flex items-center gap-0.5">
            {/* Mode selector */}
            <Popover open={modeOpen} onOpenChange={setModeOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-[12px] font-medium text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white/80"
              >
                <ModeIcon className="h-3.5 w-3.5" />
                {currentMode?.label}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              sideOffset={8}
              className="w-52 rounded-xl border border-white/[0.08] bg-[#1e1f2a] p-1.5 shadow-2xl"
            >
              {chatModes.map((mode) => {
                  const Icon = MODE_ICON_MAP[mode.id] ?? DEFAULT_ICON
                  const isActive = mode.id === selectedMode
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setSelectedMode(mode.id)
                        setModeOpen(false)
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/[0.06]"
                    >
                      <Icon className={`h-4 w-4 ${isActive ? "text-white/80" : "text-white/40"}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-[13px] font-medium ${isActive ? "text-white/90" : "text-white/60"}`}>
                          {mode.label}
                        </div>
                        <div className="text-[11px] text-white/30">{mode.description}</div>
                      </div>
                      {isActive && <Check className="h-3.5 w-3.5 text-white/50 shrink-0" />}
                    </button>
                  )
                })}
            </PopoverContent>
            </Popover>

            <div className="mx-0.5 h-3.5 w-px bg-white/[0.06]" />

            {/* Model selector */}
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
                  className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-[12px] font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/70"
                >
                  {currentModel?.label}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-52 rounded-xl border border-white/[0.08] bg-[#1e1f2a] p-0 shadow-2xl"
                onOpenAutoFocus={(e) => {
                  e.preventDefault()
                  modelSearchRef.current?.focus()
                }}
              >
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-2.5 py-2">
                  <Search className="h-3.5 w-3.5 shrink-0 text-white/30" />
                  <input
                    ref={modelSearchRef}
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder="Search models"
                    className="w-full bg-transparent text-[12px] text-white/80 placeholder:text-white/30 outline-none"
                  />
                </div>
                <div className="max-h-[240px] overflow-y-auto p-1.5">
                  {filteredModels.length === 0 ? (
                    <div className="px-2.5 py-3 text-center text-[12px] text-white/30">No models found</div>
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
                          <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white/80" : "text-white/40"}`} />
                          <span className={`flex-1 text-[12px] font-medium ${isActive ? "text-white/90" : "text-white/60"}`}>
                            {model.label}
                          </span>
                          {isActive && <Check className="h-3.5 w-3.5 text-white/50 shrink-0" />}
                        </button>
                      )
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Right: attach + send */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/50"
              title="Attach file"
            >
              <Paperclip className="h-3.5 w-3.5" />
            </button>

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
          </div>
        </div>
      </div>
    </div>
  )
}
