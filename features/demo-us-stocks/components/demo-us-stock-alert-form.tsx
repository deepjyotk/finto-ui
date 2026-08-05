"use client"

import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createAlertRule,
  formatDirection,
  formatWindow,
  type AlertDirection,
  type AlertRule,
} from "@/features/demo-us-stocks/apis/demo-us-stocks-api"

interface DemoUsStockAlertFormProps {
  isOpen: boolean
  onClose: () => void
  symbols: string[]
  windowOptions: number[]
  onCreated: (rule: AlertRule) => void
}

const DEFAULT_THRESHOLD = "2"
const DEFAULT_DIRECTION: AlertDirection = "up"

export function DemoUsStockAlertForm({
  isOpen,
  onClose,
  symbols,
  windowOptions,
  onCreated,
}: DemoUsStockAlertFormProps) {
  const [symbol, setSymbol] = useState("")
  const [windowSeconds, setWindowSeconds] = useState("")
  const [direction, setDirection] = useState<AlertDirection>(DEFAULT_DIRECTION)
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset to sensible defaults each time the dialog opens.
  useEffect(() => {
    if (!isOpen) return
    setSymbol(symbols[0] ?? "")
    setWindowSeconds(String(windowOptions[1] ?? windowOptions[0] ?? 300))
    setDirection(DEFAULT_DIRECTION)
    setThreshold(DEFAULT_THRESHOLD)
    setError(null)
    setIsSubmitting(false)
  }, [isOpen, symbols, windowOptions])

  const parsedThreshold = Number(threshold)
  const isThresholdValid =
    threshold.trim().length > 0 &&
    Number.isFinite(parsedThreshold) &&
    parsedThreshold > 0 &&
    parsedThreshold <= 100
  const isReady =
    Boolean(symbol) && Boolean(windowSeconds) && Boolean(direction) && isThresholdValid

  const handleSubmit = async () => {
    if (!isReady) return
    setIsSubmitting(true)
    setError(null)
    try {
      const rule = await createAlertRule({
        symbol,
        window_seconds: Number(windowSeconds),
        percentage_threshold: parsedThreshold,
        direction,
      })
      onCreated(rule)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create the alert rule")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create US Stock Alert</DialogTitle>
          <DialogDescription>
            Get alerted when a stock moves up or down by at least your threshold within the
            selected window.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label htmlFor="demo-us-stock-symbol">Stock symbol</Label>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger id="demo-us-stock-symbol">
                <SelectValue placeholder="Select a symbol" />
              </SelectTrigger>
              <SelectContent>
                {symbols.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only symbols the demo streams from Alpaca are available.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="demo-us-stock-window">Time window</Label>
            <Select value={windowSeconds} onValueChange={setWindowSeconds}>
              <SelectTrigger id="demo-us-stock-window">
                <SelectValue placeholder="Select a window" />
              </SelectTrigger>
              <SelectContent>
                {windowOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {formatWindow(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="demo-us-stock-direction">Direction</Label>
            <Select
              value={direction}
              onValueChange={(value) => setDirection(value as AlertDirection)}
            >
              <SelectTrigger id="demo-us-stock-direction">
                <SelectValue placeholder="Select a direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="up">Up</SelectItem>
                <SelectItem value="down">Down</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="demo-us-stock-threshold">Percentage-change threshold</Label>
            <div className="relative">
              <Input
                id="demo-us-stock-threshold"
                type="number"
                inputMode="decimal"
                min="0.01"
                max="100"
                step="0.1"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
            {symbol && windowSeconds && direction && isThresholdValid ? (
              <p className="text-xs text-muted-foreground">
                Alert me when {symbol} moves {formatDirection(direction)} by at least{" "}
                {parsedThreshold}% within {formatWindow(Number(windowSeconds))}.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Enter a value between 0.01 and 100.
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isReady || isSubmitting}>
            {isSubmitting ? "Creating..." : "Create alert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
