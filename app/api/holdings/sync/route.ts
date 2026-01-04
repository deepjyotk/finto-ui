import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Get session/auth token - adjust based on your auth setup
    const authHeader = req.headers.get('authorization')
    const cookieHeader = req.headers.get('cookie')
    
    // You may need to extract user_id from your auth system
    // For now, using a placeholder - replace with actual auth logic
    
    const body = await req.json()
    const holdings = body.holdings || []
    const brokerName = body.broker_name || 'Zerodha' // Default to Zerodha (Kite Connect API)

    if (!holdings.length) {
      return NextResponse.json({
        success: true,
        synced_count: 0,
        updated_count: 0,
        message: 'No holdings to sync'
      })
    }

    // Call your backend API to sync holdings
    const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
    
    if (!backendUrl) {
      // Backend not configured yet - return mock success
      return NextResponse.json({
        error: 'Backend API not configured. Please set BACKEND_API_URL or NEXT_PUBLIC_API_BASE_URL environment variable.'
      }, { status: 500 })
    }
    
    const response = await fetch(`${backendUrl}/api/v1/holdings/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || '',
        'Cookie': cookieHeader || '',
      },
      body: JSON.stringify({
        broker_name: brokerName,
        holdings: holdings
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // Handle 404 specifically - backend endpoint not implemented yet
      if (response.status === 404) {
        throw new Error('Backend sync endpoint not implemented yet. Please implement POST /api/v1/holdings/sync on your backend.')
      }
      
      throw new Error(errorData.detail || errorData.message || `Backend returned ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      synced_count: result.synced_count || 0,
      updated_count: result.updated_count || 0,
      message: result.message || 'Holdings synced successfully',
      last_sync: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync holdings' },
      { status: 500 }
    )
  }
}
