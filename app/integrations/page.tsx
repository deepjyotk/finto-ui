"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Building2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WhatsAppIntegrationCard } from "@/components/home/whatsapp-integration-card"
import { ConnectBrokerModal } from "@/components/home/connect-broker-modal"
import { apiClient, type HomeFeedSchema, type WhatsAppPayload } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import Navbar from "@/components/landing/Navbar"

export default function IntegrationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [homeFeed, setHomeFeed] = useState<HomeFeedSchema | null>(null)
  const [showBrokerModal, setShowBrokerModal] = useState(false)
  const [isConnectingWhatsApp, setIsConnectingWhatsApp] = useState(false)

  // Fetch home feed data
  useEffect(() => {
    const fetchHomeFeed = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await apiClient.getHomeFeed()
        setHomeFeed(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load home feed"
        setError(errorMessage)
        
        // If unauthorized, redirect to login
        if (errorMessage.includes("401") || errorMessage.includes("unauthorized")) {
          toast({
            title: "Authentication required",
            description: "Please log in to continue",
            variant: "destructive",
          })
          router.push("/")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchHomeFeed()
  }, [router, toast])

  // Get WhatsApp integration data
  const whatsappData: WhatsAppPayload | null =
    homeFeed?.chat_integrations?.[0]?.whatsapp || null

  // Handle WhatsApp connection
  const handleConnectWhatsApp = async () => {
    setIsConnectingWhatsApp(true)
    try {
      const response = await apiClient.createWhatsAppConnectIntent({
        ttl_minutes: 10
      })
      
      // Open the WhatsApp deeplink in a new tab
      window.open(response.deeplink, '_blank')
      
      toast({
        title: "Connection initiated",
        description: "Please complete the connection in the WhatsApp window that opened.",
      })
      
      // Refresh home feed after a short delay to check if connection was successful
      setTimeout(async () => {
        try {
          const data = await apiClient.getHomeFeed()
          setHomeFeed(data)
        } catch (err) {
          // Silently fail refresh, user can manually refresh if needed
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

  // Handle WhatsApp deletion
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
      await apiClient.deleteWhatsAppIntegration(whatsappData.id)
      
      toast({
        title: "WhatsApp disconnected",
        description: "Your WhatsApp integration has been removed",
      })
      
      // Refresh home feed to reflect the deletion
      const data = await apiClient.getHomeFeed()
      setHomeFeed(data)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete WhatsApp integration",
        variant: "destructive",
      })
    }
  }

  // Handle broker connection
  const handleConnectBroker = async (brokerId: string) => {
    try {
      const selectedBroker = homeFeed?.available_brokers.find(
        (b) => b.broker_id === brokerId
      )

      // TODO: Implement broker connection flow based on broker type
      // For now, we'll handle Kite (Zerodha) as an example
      if (selectedBroker?.broker_name.toLowerCase().includes("zerodha")) {
        // Redirect to Kite login
        window.location.href = apiClient.getKiteLoginUrl()
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

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto p-6 max-w-6xl">
          <div className="space-y-6">
            <div>
              <Skeleton className="h-10 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error) {
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Manage your integrations and broker connections
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* WhatsApp Integration Card */}
          <WhatsAppIntegrationCard
            whatsappData={whatsappData}
            onConnect={handleConnectWhatsApp}
            onDelete={handleDeleteWhatsApp}
            isConnecting={isConnectingWhatsApp}
          />

          {/* Broker Connection Card */}
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

        {/* Available Brokers Info */}
        {homeFeed?.available_brokers && homeFeed.available_brokers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Available Brokers</CardTitle>
              <CardDescription>
                {homeFeed.available_brokers.length} broker{homeFeed.available_brokers.length !== 1 ? "s" : ""} available for connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {homeFeed.available_brokers.slice(0, 8).map((broker) => (
                  <div
                    key={broker.broker_id}
                    className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Building2 className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium text-center">{broker.broker_name}</p>
                    <p className="text-xs text-muted-foreground">{broker.country}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Connect Broker Modal */}
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

