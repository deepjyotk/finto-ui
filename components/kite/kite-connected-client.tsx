"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import useKiteConnection from "@/lib/hooks/use-kite-connection"

type StatusType = string

export default function KiteConnectedClient({ status }: { status: StatusType }) {
  const router = useRouter()
  const { connected, loading, session, getLoginUrl, refresh } = useKiteConnection({ shouldPoll: status === "success" })

  useEffect(() => {
    if (status === "success" && !connected && !loading) {
      refresh()
    }
  }, [status, connected, loading, refresh])

  const handleLoginRetry = () => {
    window.location.href = getLoginUrl()
  }

  const handleGoHoldings = () => {
    router.push("/holdings")
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-6">
      <h1 className="text-2xl font-semibold mb-4">Kite Connection</h1>
      <div className="space-y-4">
        <StatusBlock status={status} connected={connected} loading={loading} />
        {connected && (
          <div className="rounded border p-4 bg-gray-50">
            <p className="text-sm text-gray-700 mb-2">Connected session summary:</p>
            <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap">
{JSON.stringify(session, null, 2)}
            </pre>
          </div>
        )}
        <div className="flex gap-2">
          <Button size="sm" variant={connected ? "default" : "secondary"} onClick={connected ? handleGoHoldings : handleLoginRetry}>
            {connected ? "View Holdings" : "Retry Login"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => refresh()}>Refresh Status</Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>Home</Button>
        </div>
      </div>
    </div>
  )
}

function StatusBlock({ status, connected, loading }: { status: StatusType; connected: boolean; loading: boolean }) {
  if (loading) return <p className="text-sm text-gray-600">Checking connection...</p>

  if (connected) return <p className="text-sm text-green-700">Kite account connected ✅</p>

  switch (status) {
    case "missing_api_secret":
      return <p className="text-sm text-orange-700">API secret missing on backend. TODO: Provide setup instructions.</p>
    case "failed":
      return <p className="text-sm text-red-700">Authorization failed. Please retry.</p>
    case "error":
      return <p className="text-sm text-red-700">Unexpected error exchanging token. Retry or check logs.</p>
    case "success":
      return <p className="text-sm text-gray-700">Login success. Finalizing connection... If this takes more than a few seconds, click “Refresh Status” or “View Portfolio”.</p>
    default:
      return <p className="text-sm text-gray-700">Awaiting status...</p>
  }
}
