import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }
    
    if (!process.env.FAL_KEY) {
      return NextResponse.json(
        { error: 'Fal.ai API key not configured' },
        { status: 500 }
      )
    }
    
    // Fal.ai doesn't provide a public balance API endpoint
    // Return service status and helpful information
    return NextResponse.json({
      provider: 'Fal.ai',
      balance: null,
      currency: 'USD',
      lastUpdated: new Date().toISOString(),
      status: 'configured',
      note: 'Fal.ai does not provide a public balance API. Monitor usage through their dashboard.',
      dashboardUrl: 'https://fal.ai/dashboard',
      serviceHealth: 'API key configured and ready'
    })
    
  } catch (error) {
    console.error('Fal.ai balance fetch error:', error)
    
    // Return a response indicating the service is configured but balance is unknown
    return NextResponse.json({
      provider: 'Fal.ai',
      balance: null,
      currency: 'USD',
      error: 'API key configured but balance unavailable',
      lastUpdated: new Date().toISOString(),
      note: 'Monitor usage and balance through Fal.ai dashboard: https://fal.ai/dashboard'
    })
  }
}