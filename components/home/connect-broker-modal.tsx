"use client"

import { useState, useMemo, useRef } from "react"
import { Upload, Link2, FileSpreadsheet, Lock } from "lucide-react"
import * as XLSX from "xlsx"
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
import { Input } from "@/components/ui/input"
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
  const [panPassword, setPanPassword] = useState("")
  const [showPanModal, setShowPanModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedBroker = useMemo(() => {
    return brokers.find((b) => b.broker_id === selectedBrokerId)
  }, [brokers, selectedBrokerId])

  const isZerodha = selectedBroker?.broker_name.toLowerCase().includes("zerodha")
  const isAngelOne = selectedBroker?.broker_name.toLowerCase().includes("angel")
  const isGrow = selectedBroker?.broker_name.toLowerCase().includes("grow")
  const showOptions = isZerodha || isAngelOne || isGrow

  const isXlsxFile = (file: File) => file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")

  const isFilePasswordProtected = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result as ArrayBuffer
          XLSX.read(data, { type: "buffer" })
          resolve(false)
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err)
          resolve(errorMsg.includes("password") || errorMsg.includes("encrypt") || errorMsg.includes("EPASS"))
        }
      }
      reader.onerror = () => resolve(false)
      reader.readAsArrayBuffer(file)
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (isAngelOne && isXlsxFile(file)) {
      const isProtected = await isFilePasswordProtected(file)
      if (isProtected) {
        setSelectedFile(file)
        setShowPanModal(true)
        return
      }
    }
    setSelectedFile(file)
  }

  const handlePanSubmit = () => {
    if (!panPassword) return
    setShowPanModal(false)
    // File is already set, password is stored - ready for upload
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("broker_id", selectedBrokerId)
      if (panPassword) {
        formData.append("password", panPassword.toUpperCase())
      }

      const response = await uploadHoldingsFile(formData)

      toast({
        title: "Uploaded successfully!",
        description: response.message || `${response.records_processed} records processed.`,
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
    setPanPassword("")
    setShowPanModal(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onClose()
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect New Broker</DialogTitle>
          <DialogDescription>
            Select a new broker to connect your account or upload holdings.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {brokers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p className="font-medium">All brokers are already connected</p>
              <p className="text-sm mt-1">You can update your existing portfolios from the main page.</p>
            </div>
          ) : (
          <>
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
          </>
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

    {/* PAN Card Password Modal for AngelOne */}
    <Dialog open={showPanModal} onOpenChange={(open) => {
      if (!open) {
        setShowPanModal(false)
        setPanPassword("")
      }
    }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-500" />
            File is Password Protected
          </DialogTitle>
          <DialogDescription>
            AngelOne exports are protected with your PAN card number. Enter it below to unlock.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="pan-input">PAN Card Number</Label>
          <Input
            id="pan-input"
            placeholder="e.g. ABCDE1234F"
            value={panPassword}
            onChange={(e) => setPanPassword(e.target.value.toUpperCase())}
            className="mt-2 uppercase"
            maxLength={10}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Your PAN is used as the password to unlock the file.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setShowPanModal(false)
            setPanPassword("")
            setSelectedFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ""
          }}>
            Cancel
          </Button>
          <Button onClick={handlePanSubmit} disabled={panPassword.length !== 10}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
