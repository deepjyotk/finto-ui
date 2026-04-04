import { NextRequest, NextResponse } from "next/server"
import { FASTAPI_BASE_URL } from "@/lib/utils"

const A2UI_CHAT_ENDPOINT = `${FASTAPI_BASE_URL}/api/v1/a2ui/chat`

const isEventStream = (response: Response) =>
  (response.headers.get("content-type") || "").includes("text/event-stream")

const buildEventStreamResponse = (backendResponse: Response) => {
  const { readable, writable } = new TransformStream()

  backendResponse.body?.pipeTo(writable).catch((err) => {
    console.error("[A2UI Chat] Stream pipe error:", err)
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const cookieHeader = request.headers.get("cookie") || ""

    const backendResponse = await fetch(A2UI_CHAT_ENDPOINT, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(body),
    })

    if (!backendResponse.ok && !isEventStream(backendResponse)) {
      const errorText = await backendResponse.text()
      console.error("[A2UI Chat] Backend error:", backendResponse.status, errorText)
      return NextResponse.json(
        { error: errorText || "Backend request failed" },
        { status: backendResponse.status }
      )
    }

    if (isEventStream(backendResponse)) {
      return buildEventStreamResponse(backendResponse)
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[A2UI Chat] Proxy error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
