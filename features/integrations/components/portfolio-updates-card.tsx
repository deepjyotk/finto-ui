"use client"

import { useState, useRef } from "react"
import { formatDistanceToNow, format } from "date-fns"
import * as XLSX from "xlsx"
import {
  Briefcase,
  Calendar,
  Upload,
  Eye,
  RefreshCw,
  FileSpreadsheet,
  CloudUpload,
  Link2,
  ChevronRight,
  Info,
  X,
  Lock,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import {
  deleteBrokerHoldings,
  fetchGatewayHoldingsAndLog,
  getKiteLoginUrl,
  startGatewayHoldingsImport,
  updateHoldingsFile,
  type BrokerPayload,
  type PortfolioUpdates,
} from "@/features/integrations/apis/integrations-api"
import { cn } from "@/lib/utils"

interface PortfolioUpdatesCardProps {
  portfolioUpdates: PortfolioUpdates[]
  availableBrokers: BrokerPayload[]
  onRefresh?: () => void
}

export function PortfolioUpdatesCard({
  portfolioUpdates,
  availableBrokers,
  onRefresh,
}: PortfolioUpdatesCardProps) {
  const { toast } = useToast()
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioUpdates | null>(null)
  const [reuploadModalOpen, setReuploadModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [panPassword, setPanPassword] = useState("")
  const [showPanModal, setShowPanModal] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [portfolioToDelete, setPortfolioToDelete] = useState<PortfolioUpdates | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [reuploadTab, setReuploadTab] = useState<"upload" | "api">("upload")
  const [isGatewayConnecting, setIsGatewayConnecting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadSmallcaseGatewayScript = (): Promise<void> => {
    if (typeof window === "undefined") return Promise.resolve()
    if (window.scDK) return Promise.resolve()
    return new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-smallcase-scdk="true"]'
      )
      if (existing) {
        if (window.scDK) {
          resolve()
          return
        }
        existing.addEventListener("load", () => resolve(), { once: true })
        existing.addEventListener("error", () => reject(new Error("Failed to load Gateway SDK")), {
          once: true,
        })
        return
      }
      const script = document.createElement("script")
      script.src = "https://gateway.smallcase.com/scdk/2.0.0/scdk.js"
      script.async = true
      script.dataset.smallcaseScdk = "true"
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load smallcase Gateway SDK"))
      document.body.appendChild(script)
    })
  }

  const handleAngelGatewayConnect = async () => {
    setIsGatewayConnecting(true)
    try {
      await loadSmallcaseGatewayScript()
      const start = await startGatewayHoldingsImport()
      const ScDK = window.scDK
      if (!ScDK) {
        throw new Error("Gateway SDK did not initialize (window.scDK missing)")
      }
      const gateway = new ScDK({
        gateway: start.gateway_name,
        smallcaseAuthToken: start.guest_auth_token,
        config: { amo: true },
      })
      const txnResponse = await gateway.triggerTransaction({
        transactionId: start.transaction_id,
        brokers: ["angelbroking"],
      })
      const authToken = txnResponse?.smallcaseAuthToken
      if (!authToken) {
        throw new Error("No smallcaseAuthToken returned from Gateway — complete broker login and consent.")
      }
      await fetchGatewayHoldingsAndLog(authToken, false)
      toast({
        title: "Portfolio snapshot received",
        description:
          "Holdings were fetched via smallcase Gateway and logged on the server. No data was saved to the database yet.",
      })
      onRefresh?.()
    } catch (err) {
      toast({
        title: "Gateway connection failed",
        description: err instanceof Error ? err.message : "Could not complete Gateway flow",
        variant: "destructive",
      })
    } finally {
      setIsGatewayConnecting(false)
    }
  }

  const isAngelOne = (portfolio: PortfolioUpdates | null) =>
    portfolio?.broker_name.toLowerCase().includes("angel")

  const isZerodha = (portfolio: PortfolioUpdates | null) =>
    portfolio?.broker_name.toLowerCase().includes("zerodha")

  const isXlsxFile = (file: File) =>
    file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")

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

  const handleViewPortfolio = (portfolio: PortfolioUpdates) => {
    setSelectedPortfolio(portfolio)
    setViewModalOpen(true)
  }

  const handleReuploadClick = (portfolio: PortfolioUpdates) => {
    setSelectedPortfolio(portfolio)
    setReuploadModalOpen(true)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (isAngelOne(selectedPortfolio) && isXlsxFile(file)) {
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
  }

  const handleReupload = async () => {
    if (!selectedFile || !selectedPortfolio) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      if (panPassword) {
        formData.append("password", panPassword.toUpperCase())
      }

      const response = await updateHoldingsFile(selectedPortfolio.broker_user_id, formData)

      toast({
        title: "Portfolio updated!",
        description: response.message || `${response.records_processed} records processed.`,
      })

      handleCloseReuploadModal()
      onRefresh?.()
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

  const handleCloseReuploadModal = () => {
    setReuploadModalOpen(false)
    setSelectedPortfolio(null)
    setSelectedFile(null)
    setPanPassword("")
    setShowPanModal(false)
    setReuploadTab("upload")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleConnectKiteFromResync = () => {
    window.location.href = getKiteLoginUrl()
  }

  const handleDeleteClick = (portfolio: PortfolioUpdates) => {
    setPortfolioToDelete(portfolio)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!portfolioToDelete) return

    setIsDeleting(true)
    try {
      const response = await deleteBrokerHoldings(portfolioToDelete.broker_user_id)

      toast({
        title: "Portfolio deleted",
        description: response.message || `Deleted ${response.deleted_holdings_count} holdings.`,
      })

      setDeleteModalOpen(false)
      setPortfolioToDelete(null)
      onRefresh?.()
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Failed to delete portfolio",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false)
    setPortfolioToDelete(null)
  }

  const getUploadMethodIcon = (method: string) => {
    const lower = method.toLowerCase()
    if (lower.includes("api") || lower.includes("connect")) return <Link2 className="h-3.5 w-3.5" />
    if (lower.includes("file") || lower.includes("upload") || lower.includes("csv") || lower.includes("excel")) return <FileSpreadsheet className="h-3.5 w-3.5" />
    return <CloudUpload className="h-3.5 w-3.5" />
  }

  const getUploadMethodBadgeVariant = (method: string): "default" | "secondary" | "outline" => {
    const lower = method.toLowerCase()
    if (lower.includes("api") || lower.includes("connect")) return "default"
    return "secondary"
  }

  const formatLastUpdated = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return dateString
    }
  }

  const formatFullDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "PPpp")
    } catch {
      return dateString
    }
  }

  if (portfolioUpdates.length === 0) {
    return null
  }

  return (
    <>
      <Card className="overflow-hidden border-border/40 bg-gradient-to-br from-card to-card/80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Your Portfolios</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {portfolioUpdates.length} connected portfolio{portfolioUpdates.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {portfolioUpdates.map((portfolio) => (
              <div
                key={portfolio.broker_id}
                className="group relative rounded-xl border border-border/50 bg-background/50 p-4 transition-all hover:border-primary/30 hover:bg-background/80 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground truncate">
                        {portfolio.broker_name}
                      </h3>
                      <Badge
                        variant={getUploadMethodBadgeVariant(portfolio.uploaded_via)}
                        className="gap-1 text-[10px] h-5"
                      >
                        {getUploadMethodIcon(portfolio.uploaded_via)}
                        {portfolio.uploaded_via}
                      </Badge>
                    </div>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Updated {formatLastUpdated(portfolio.last_updated_at)}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="start">
                          <p>{formatFullDate(portfolio.last_updated_at)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {Object.keys(portfolio.additional_metadata).length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                        <Info className="h-3 w-3" />
                        <span>
                          {Object.keys(portfolio.additional_metadata).length} additional detail{Object.keys(portfolio.additional_metadata).length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleViewPortfolio(portfolio)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View details</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-emerald-500/10 hover:text-emerald-600"
                            onClick={() => handleReuploadClick(portfolio)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Re-upload portfolio</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-500"
                            onClick={() => handleDeleteClick(portfolio)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete portfolio</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View Portfolio Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              {selectedPortfolio?.broker_name}
            </DialogTitle>
            <DialogDescription>
              Portfolio connection details and metadata
            </DialogDescription>
          </DialogHeader>

          {selectedPortfolio && (
            <div className="space-y-4 py-4">
              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">Upload Method</span>
                  <Badge variant={getUploadMethodBadgeVariant(selectedPortfolio.uploaded_via)} className="gap-1">
                    {getUploadMethodIcon(selectedPortfolio.uploaded_via)}
                    {selectedPortfolio.uploaded_via}
                  </Badge>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-sm font-medium">{formatFullDate(selectedPortfolio.last_updated_at)}</span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">Broker ID</span>
                  <code className="text-xs bg-background px-2 py-0.5 rounded font-mono">
                    {selectedPortfolio.broker_id.slice(0, 8)}...
                  </code>
                </div>
              </div>

              {Object.keys(selectedPortfolio.additional_metadata).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    Additional Information
                  </h4>
                  <div className="grid gap-2">
                    {Object.entries(selectedPortfolio.additional_metadata).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                        <span className="text-sm text-muted-foreground capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setViewModalOpen(false)
                if (selectedPortfolio) {
                  handleReuploadClick(selectedPortfolio)
                }
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Update Portfolio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Re-upload Portfolio Modal */}
      <Dialog open={reuploadModalOpen} onOpenChange={(open) => !open && handleCloseReuploadModal()}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Update {selectedPortfolio?.broker_name} Portfolio
            </DialogTitle>
            <DialogDescription>
              Upload a new export, or connect via your broker&apos;s API to refresh holdings.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={reuploadTab}
            onValueChange={(v) => setReuploadTab(v as "upload" | "api")}
            className="py-2"
          >
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-lg p-1">
              <TabsTrigger value="upload" className="gap-1.5">
                <CloudUpload className="h-4 w-4 shrink-0" />
                Upload file
              </TabsTrigger>
              <TabsTrigger value="api" className="gap-1.5">
                <Link2 className="h-4 w-4 shrink-0" />
                Connect via API
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4 space-y-0">
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                  selectedFile
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/30 hover:bg-muted/30"
                )}
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
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <FileSpreadsheet className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ""
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <Upload className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Drop your file here</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        or click to browse (Excel, CSV)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="api" className="mt-4">
              {isZerodha(selectedPortfolio) && (
                <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-5">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background">
                      <Link2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1 text-left">
                      <p className="text-sm font-medium leading-snug">Zerodha Kite</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Re-authorize with Kite Connect to pull the latest holdings from your Zerodha
                        account. You&apos;ll be redirected to Zerodha to approve access.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="w-full gap-2"
                    onClick={handleConnectKiteFromResync}
                  >
                    <Link2 className="h-4 w-4" />
                    Connect with Kite
                  </Button>
                </div>
              )}

              {isAngelOne(selectedPortfolio) && (
                <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-5">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background">
                      <Link2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1 text-left">
                      <p className="text-sm font-medium leading-snug">Connect via API</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Connect through{" "}
                        <span className="font-medium text-foreground">smallcase Gateway</span> — you
                        sign in with Angel One in their secure flow; we never see your broker
                        password. After you consent to holdings import, we fetch a snapshot via
                        Gateway and log analytics on the server (no DB write yet).
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="w-full gap-2"
                    disabled={isGatewayConnecting}
                    onClick={handleAngelGatewayConnect}
                  >
                    {isGatewayConnecting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Opening Gateway…
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4" />
                        Connect via API
                      </>
                    )}
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                    Requires <span className="font-medium text-foreground">SMALLCASE_GATEWAY_*</span> env
                    keys on the API. Prefer a file? Use the{" "}
                    <span className="font-medium text-foreground">Upload file</span> tab.
                  </p>
                </div>
              )}

              {!isZerodha(selectedPortfolio) && !isAngelOne(selectedPortfolio) && (
                <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    API-based refresh for this broker isn&apos;t available yet. Please use the{" "}
                    <span className="font-medium text-foreground">Upload file</span> tab.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseReuploadModal}>
              Cancel
            </Button>
            {reuploadTab === "upload" && (
              <Button
                onClick={handleReupload}
                disabled={!selectedFile || isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload & Update
                  </>
                )}
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
            <Label htmlFor="pan-reupload-input">PAN Card Number</Label>
            <Input
              id="pan-reupload-input"
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

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={(open) => !open && handleCloseDeleteModal()}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-5 w-5" />
              Delete Portfolio
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the <span className="font-semibold">{portfolioToDelete?.broker_name}</span> portfolio? This will remove all holdings data associated with this broker.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-sm text-red-400">
                This action cannot be undone. All holdings and metadata for this broker will be permanently deleted.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDeleteModal} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Portfolio
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
