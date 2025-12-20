"use client"

import { useState, useRef } from "react"
import { formatDistanceToNow, format } from "date-fns"
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
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { uploadHoldingsFile, type PortfolioUpdates, type BrokerPayload } from "@/lib/api/integrations_api"
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleViewPortfolio = (portfolio: PortfolioUpdates) => {
    setSelectedPortfolio(portfolio)
    setViewModalOpen(true)
  }

  const handleReuploadClick = (portfolio: PortfolioUpdates) => {
    setSelectedPortfolio(portfolio)
    setReuploadModalOpen(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleReupload = async () => {
    if (!selectedFile || !selectedPortfolio) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("broker_id", selectedPortfolio.broker_id)

      const response = await uploadHoldingsFile(formData)

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
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
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
                    {/* Broker Name & Upload Method */}
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

                    {/* Last Updated */}
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

                    {/* Additional Metadata Preview */}
                    {Object.keys(portfolio.additional_metadata).length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                        <Info className="h-3 w-3" />
                        <span>
                          {Object.keys(portfolio.additional_metadata).length} additional detail{Object.keys(portfolio.additional_metadata).length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
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
              {/* Main Info */}
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

              {/* Additional Metadata */}
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
              Upload a new file to replace your existing holdings data
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseReuploadModal}>
              Cancel
            </Button>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

