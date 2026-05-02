"use client"

import { useId, type ChangeEvent, type FormEvent } from "react"

import { cn } from "@/lib/utils"

export interface BasicTextFieldProps {
  label: string
  value?: string
  variant?: "longText" | "number" | "shortText" | "obscured"
  setValue?: (value: string) => void
  validationErrors?: string[]
  fieldName?: string
}

export function A2UIBasicTextField({
  label,
  value = "",
  variant = "shortText",
  setValue,
  validationErrors,
  fieldName,
}: BasicTextFieldProps) {
  const id = useId()
  const hasError = Boolean(validationErrors?.length)
  const inputClass = cn(
    "w-full rounded-lg border bg-white/[0.04] px-3 py-2.5 text-sm text-white shadow-inner shadow-black/10 outline-none transition-colors placeholder:text-gray-600",
    "border-white/12 hover:border-white/20 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/15",
    hasError && "border-red-400/70 focus:border-red-400/80 focus:ring-red-400/15"
  )

  const handleChange = (
    event:
      | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | FormEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setValue?.(event.currentTarget.value)
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5" data-a2ui-field-name={fieldName}>
      <label htmlFor={id} className="text-xs font-medium text-gray-300">
        {label}
      </label>
      {variant === "longText" ? (
        <textarea
          id={id}
          value={value}
          onChange={handleChange}
          onInput={handleChange}
          rows={3}
          className={cn(inputClass, "resize-y")}
          aria-invalid={hasError || undefined}
        />
      ) : (
        <input
          id={id}
          type={variant === "number" ? "number" : variant === "obscured" ? "password" : "text"}
          inputMode={variant === "number" ? "decimal" : undefined}
          value={value}
          onChange={handleChange}
          onInput={handleChange}
          className={inputClass}
          aria-invalid={hasError || undefined}
        />
      )}
      {hasError && <p className="text-xs text-red-300">{validationErrors?.[0]}</p>}
    </div>
  )
}
