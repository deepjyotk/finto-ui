"use client"

import { useState, useMemo, useRef } from "react"
import { Upload, Link2, FileSpreadsheet } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { BrokerPayload } from "@/lib/api/integrations_api"
import { getKiteLoginUrl, uploadHoldingsFile } from "@/lib/api/integrations_api"
import { useToast } from "@/hooks/use-toast"

interface ConnectBrokerModalProps {
  isOpen: boolean
  onClose: () => void
  brokers: BrokerPayload[]
  onSubmit: (brokerId: string) => void
}

export function ConnectBrokerModal({
  isOpen,
  onClose,
  brokers,
  onSubmit,
}: ConnectBrokerModalProps) {
  const { toast } = useToast()
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedBroker = useMemo(() => {
    return brokers.find((b) => b.broker_id === selectedBrokerId)
  }, [brokers, selectedBrokerId])

  const isZerodha = selectedBroker?.broker_name.toLowerCase().includes("zerodha")
  const isAngelOne = selectedBroker?.broker_name.toLowerCase().includes("angel")
  const isGrow = selectedBroker?.broker_name.toLowerCase().includes("grow")
  const showOptions = isZerodha || isAngelOne || isGrow

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("broker_id", selectedBrokerId)

      await uploadHoldingsFile(formData)

      toast({
        title: "Upload successful",
        description: "Your holdings file has been uploaded.",
      })
      handleClose()
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleConnectKite = () => {
    window.location.href = getKiteLoginUrl()
  }

  const handleClose = () => {
    setSelectedBrokerId("")
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect Broker</DialogTitle>
          <DialogDescription>
            Select your broker to connect your account or upload holdings.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Broker Name Dropdown */}
          <div className="grid gap-2">
            <Label htmlFor="broker-name">Broker Name</Label>
            <Select
              value={selectedBrokerId}
              onValueChange={(value) => {
                setSelectedBrokerId(value)
                setSelectedFile(null)
              }}
            >
              <SelectTrigger id="broker-name">
                <SelectValue placeholder="Select broker" />
              </SelectTrigger>
              <SelectContent>
                {brokers.map((broker) => (
                  <SelectItem key={broker.broker_id} value={broker.broker_id}>
                    {broker.broker_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Connection Options */}
          {showOptions && (
            <div className="space-y-4">
              <Label>Connection Options</Label>
              
              {/* Zerodha: Kite Connect + Upload */}
              {isZerodha && (
                <div className="grid gap-3">
                  <Button
                    onClick={handleConnectKite}
                    className="w-full justify-start gap-3"
                    variant="outline"
                  >
                    <Link2 className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">Connect Kite Account</div>
                      <div className="text-xs text-muted-foreground">
                        Link directly with Zerodha Kite
                      </div>
                    </div>
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Option (for all supported brokers) */}
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium">Upload Holdings File</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Export from {selectedBroker?.broker_name} and upload Excel/CSV
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {showOptions && selectedFile && (
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload Holdings"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
