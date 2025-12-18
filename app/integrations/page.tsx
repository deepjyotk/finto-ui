import { cookies } from "next/headers"
import IntegrationsPageClient from "@/components/integrations/integrations-page-client"
import { type HomeFeedSchema } from "@/lib/api/integrations_api"

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000"

async function getHomeFeed(): Promise<{ data: HomeFeedSchema | null; error: string | null }> {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ")

  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/v1/home`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      cache: "no-store", // Always fetch fresh data
    })

    if (!response.ok) {
      if (response.status === 401) {
        return { data: null, error: "unauthorized" }
      }
      const errorText = await response.text()
      return { data: null, error: errorText || `HTTP ${response.status}` }
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    console.error("Failed to fetch home feed:", error)
    return { data: null, error: error instanceof Error ? error.message : "Failed to load" }
  }
}

export default async function IntegrationsPage() {
  const { data, error } = await getHomeFeed()

  return <IntegrationsPageClient initialData={data} initialError={error} />
}
