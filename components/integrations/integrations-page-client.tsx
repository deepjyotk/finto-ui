"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, AlertCircle } from "lucide-react"
import Navbar from "@/components/landing/Navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WhatsAppIntegrationCard } from "@/components/home/whatsapp-integration-card"
import { ConnectBrokerModal } from "@/components/home/connect-broker-modal"
import { useToast } from "@/hooks/use-toast"
import {
  createWhatsAppConnectIntent,
  deleteWhatsAppIntegration,
  getHomeFeed,
  getKiteLoginUrl,
  type HomeFeedSchema,
  type WhatsAppPayload,
} from "@/lib/api/integrations_api"

interface IntegrationsPageClientProps {
  initialData: HomeFeedSchema | null
  initialError: string | null
}

export default function IntegrationsPageClient({
  initialData,
  initialError,
}: IntegrationsPageClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [homeFeed, setHomeFeed] = useState<HomeFeedSchema | null>(initialData)
  const [error] = useState<string | null>(initialError)
  const [showBrokerModal, setShowBrokerModal] = useState(false)
  const [isConnectingWhatsApp, setIsConnectingWhatsApp] = useState(false)

  // Handle unauthorized error from server
  if (initialError === "unauthorized") {
    toast({
      title: "Authentication required",
      description: "Please log in to continue",
      variant: "destructive",
    })
    router.push("/")
    return null
  }

  const whatsappData: WhatsAppPayload | null =
    homeFeed?.chat_integrations?.[0]?.whatsapp || null

  const handleConnectWhatsApp = async () => {
    setIsConnectingWhatsApp(true)
    try {
      const response = await createWhatsAppConnectIntent({
        ttl_minutes: 10,
      })

      window.open(response.deeplink, "_blank")

      toast({
        title: "Connection initiated",
        description: "Please complete the connection in the WhatsApp window that opened.",
      })

      setTimeout(async () => {
        try {
          const data = await getHomeFeed()
          setHomeFeed(data)
        } catch {
          // User can manually refresh if needed.
        }
      }, 2000)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to connect WhatsApp. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConnectingWhatsApp(false)
    }
  }

  const handleDeleteWhatsApp = async () => {
    if (!whatsappData?.id) {
      toast({
        title: "Error",
        description: "Integration ID not found",
        variant: "destructive",
      })
      return
    }

    try {
      await deleteWhatsAppIntegration(whatsappData.id)

      toast({
        title: "WhatsApp disconnected",
        description: "Your WhatsApp integration has been removed",
      })

      const data = await getHomeFeed()
      setHomeFeed(data)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete WhatsApp integration",
        variant: "destructive",
      })
    }
  }

  const handleConnectBroker = async (brokerId: string) => {
    try {
      const selectedBroker = homeFeed?.available_brokers.find(
        (b) => b.broker_id === brokerId,
      )

      if (selectedBroker?.broker_name.toLowerCase().includes("zerodha")) {
        window.location.href = getKiteLoginUrl()
      } else {
        toast({
          title: "Coming soon",
          description: `Connection for ${selectedBroker?.broker_name} will be implemented`,
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to connect broker",
        variant: "destructive",
      })
    }
  }

  if (error && error !== "unauthorized") {
    return (
      <>
        <Navbar />
        <div className="container mx-auto p-6 max-w-6xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
            <p className="text-muted-foreground">
              Manage your integrations and broker connections
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* <WhatsAppIntegrationCard
              whatsappData={whatsappData}
              onConnect={handleConnectWhatsApp}
              onDelete={handleDeleteWhatsApp}
              isConnecting={isConnectingWhatsApp}
            /> */}

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle>Broker Connection</CardTitle>
                </div>
                <CardDescription>
                  Connect your brokerage account to sync holdings and trades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setShowBrokerModal(true)} className="w-full">
                  <Building2 className="mr-2 h-4 w-4" />
                  Connect Broker
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>

        <ConnectBrokerModal
          isOpen={showBrokerModal}
          onClose={() => setShowBrokerModal(false)}
          brokers={homeFeed?.available_brokers || []}
          onSubmit={handleConnectBroker}
        />
      </div>
    </>
  )
}
