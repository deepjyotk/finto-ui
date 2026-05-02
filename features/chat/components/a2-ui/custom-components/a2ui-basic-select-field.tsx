"use client"

import { useId, type ChangeEvent } from "react"

import { cn } from "@/lib/utils"

export interface BasicSelectOption {
  label: string
  value: string
}

export interface BasicSelectFieldProps {
  label: string
  value?: string
  options: BasicSelectOption[]
  setValue?: (value: string) => void
  validationErrors?: string[]
  fieldName?: string
}

export function A2UIBasicSelectField({
  label,
  value = "",
  options,
  setValue,
  validationErrors,
  fieldName,
}: BasicSelectFieldProps) {
  const id = useId()
  const hasError = Boolean(validationErrors?.length)
  const selectClass = cn(
    "w-full appearance-none rounded-lg border bg-white/[0.04] px-3 py-2.5 text-sm text-white shadow-inner shadow-black/10 outline-none transition-colors",
    "border-white/12 hover:border-white/20 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/15",
    hasError && "border-red-400/70 focus:border-red-400/80 focus:ring-red-400/15"
  )

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setValue?.(event.currentTarget.value)
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5" data-a2ui-field-name={fieldName}>
      <label htmlFor={id} className="text-xs font-medium text-gray-300">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={handleChange}
          className={cn(selectClass, "pr-9")}
          aria-invalid={hasError || undefined}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#1a1b26]">
              {opt.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/35"
          aria-hidden
        >
          ▾
        </span>
      </div>
      {hasError && <p className="text-xs text-red-300">{validationErrors?.[0]}</p>}
    </div>
  )
}
