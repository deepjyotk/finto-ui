import { NextRequest, NextResponse } from 'next/server'

/**
 * Thesys C1Chat API Route
 * 
 * This endpoint proxies requests from the Thesys C1Chat frontend component
 * to the FastAPI backend's /api/thesys/chat endpoint.
 * 
 * Request schema (C1ChatRequest):
 * - prompt: { role: "user"|"assistant"|"system"|"tool", content: string, id?: string }
 * - threadId: string
 * - responseId: string
 * 
 * Response: Server-Sent Events (SSE) stream
 */

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Forward the request to the FastAPI backend
    const backendResponse = await fetch(`${FASTAPI_BASE_URL}/api/thesys/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies for authentication
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
      // Important: don't consume the body - we need to stream it
    })

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      console.error('[Thesys Chat] Backend error:', backendResponse.status, errorText)
      return NextResponse.json(
        { error: errorText || 'Backend request failed' },
        { status: backendResponse.status }
      )
    }

    // Check if the response is a stream (SSE)
    const contentType = backendResponse.headers.get('content-type') || ''
    
    if (contentType.includes('text/event-stream')) {
      // Stream the SSE response directly to the client
      const { readable, writable } = new TransformStream()
      
      // Pipe the backend response to the client
      backendResponse.body?.pipeTo(writable).catch((err) => {
        console.error('[Thesys Chat] Stream pipe error:', err)
      })

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      })
    }

    // For non-streaming responses, just forward the JSON
    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Thesys Chat] Proxy error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also handle OPTIONS for CORS preflight if needed
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

