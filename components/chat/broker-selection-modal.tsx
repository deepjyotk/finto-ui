"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { UserBrokerItem } from "@/lib/api/chat_api"

interface BrokerSelectionModalProps {
  open: boolean
  onClose: () => void
  brokers: UserBrokerItem[]
  onSelectBroker: (brokerId: string) => void
}

export default function BrokerSelectionModal({
  open,
  onClose,
  brokers,
  onSelectBroker,
}: BrokerSelectionModalProps) {
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(null)

  const handleConfirm = () => {
    if (selectedBrokerId) {
      onSelectBroker(selectedBrokerId)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Select Broker
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Which broker do you want this chat session to work for?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-4">
          {brokers.map((broker) => (
            <button
              key={broker.broker_id}
              type="button"
              onClick={() => setSelectedBrokerId(broker.broker_id)}
              className={`
                flex items-center gap-3 rounded-lg border p-4 transition-all
                ${
                  selectedBrokerId === broker.broker_id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }
              `}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <span className="text-lg font-medium text-foreground">
                  {broker.broker_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{broker.broker_name}</p>
              </div>
              {selectedBrokerId === broker.broker_id && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <svg
                    className="h-3 w-3 text-primary-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedBrokerId}
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


