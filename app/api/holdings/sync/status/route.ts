import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Get session/auth token - adjust based on your auth setup
    const authHeader = req.headers.get('authorization')
    const cookieHeader = req.headers.get('cookie')

    // Call your backend API to get sync status
    const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
    
    if (!backendUrl) {
      // Backend not configured yet - return empty state
      return NextResponse.json({
        last_sync: null,
        message: 'Backend API not configured'
      })
    }
    
    const response = await fetch(`${backendUrl}/api/v1/holdings/sync-status`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader || '',
        'Cookie': cookieHeader || '',
      }
    })

    if (!response.ok) {
      return NextResponse.json({
        last_sync: null,
        message: 'No sync history found'
      })
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Sync status error:', error)
    return NextResponse.json({
      last_sync: null,
      message: 'No sync history found'
    })
  }
}
