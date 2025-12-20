"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Trash2, Plus } from "lucide-react"
import { DeleteWhatsAppModal } from "./delete-whatsapp-modal"
import type { WhatsAppPayload } from "@/lib/api/integrations_api"

interface WhatsAppIntegrationCardProps {
  whatsappData: WhatsAppPayload | null
  onConnect: () => void
  onDelete: () => void
  isConnecting?: boolean
}

export function WhatsAppIntegrationCard({
  whatsappData,
  onConnect,
  onDelete,
  isConnecting = false,
}: WhatsAppIntegrationCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    setShowDeleteModal(false)
    onDelete()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-cyan-600" />
              <CardTitle>WhatsApp Integration</CardTitle>
            </div>
            {whatsappData && (
              <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                Connected
              </Badge>
            )}
          </div>
          <CardDescription>
            {whatsappData
              ? "Manage your WhatsApp connection"
              : "Connect your WhatsApp account to receive notifications"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {whatsappData ? (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
                  <MessageSquare className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Connected Number</p>
                  <p className="text-sm text-muted-foreground">{whatsappData.user_e164}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button 
              onClick={onConnect} 
              className="w-full"
              disabled={isConnecting}
            >
              <Plus className="mr-2 h-4 w-4" />
              {isConnecting ? "Connecting..." : "Connect WhatsApp"}
            </Button>
          )}
        </CardContent>
      </Card>

      <DeleteWhatsAppModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        phoneNumber={whatsappData?.user_e164 || ""}
      />
    </>
  )
}
