import { NextRequest, NextResponse } from 'next/server'

/**
 * Thesys C1Chat API Route
 * 
 * This endpoint proxies requests from the Thesys C1Chat frontend component
 * to the FastAPI backend's /api/v1/thesys/chat endpoint.
 * 
 * Request schema (C1ChatRequest):
 * - message_payload: { content: string }
 * - session_id: string
 * 
 * Response: Server-Sent Events (SSE) stream
 * 
 * Session management:
 * - If session_id is missing in the request, a new session will be created
 * - session_id can be passed via query parameter or in the request body
 */

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'

async function createSession(cookieHeader: string): Promise<string> {
  const response = await fetch(`${FASTAPI_BASE_URL}/api/v1/thesys/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`)
  }

  const data = await response.json()
  return data.session_id
}

function transformRequest(body: any, sessionId: string): any {
  // Handle different possible request formats from C1Chat
  // Transform to the new schema: { message_payload: { content: string }, session_id: string }
  
  let content = ''
  
  // Try to extract content from various possible formats
  if (body.message_payload?.content) {
    content = body.message_payload.content
  } else if (body.prompt?.content) {
    content = body.prompt.content
  } else if (typeof body.content === 'string') {
    content = body.content
  } else if (typeof body.message === 'string') {
    content = body.message
  }

  return {
    message_payload: {
      content: content,
    },
    session_id: sessionId,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const searchParams = request.nextUrl.searchParams
    const cookieHeader = request.headers.get('cookie') || ''
    
    // Get session_id from query parameter or request body
    // C1Chat might pass it in different ways, so check multiple locations
    let sessionId = searchParams.get('session_id') 
      || searchParams.get('sessionId')
      || body.session_id 
      || body.sessionId

    // If no session_id, create a new session (for new chats)
    if (!sessionId) {
      try {
        sessionId = await createSession(cookieHeader)
        console.log('[Thesys Chat] Created new session:', sessionId)
      } catch (error) {
        console.error('[Thesys Chat] Failed to create session:', error)
        return NextResponse.json(
          { error: 'Failed to create chat session' },
          { status: 500 }
        )
      }
    }

    // Transform request to match backend schema
    const transformedBody = transformRequest(body, sessionId)

    // Forward the transformed request to the FastAPI backend
    const backendResponse = await fetch(`${FASTAPI_BASE_URL}/api/v1/thesys/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies for authentication
        'Cookie': cookieHeader,
      },
      body: JSON.stringify(transformedBody),
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

