import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }
    
    // Fetch billing information from OpenAI API
    // Note: OpenAI doesn't provide a direct balance endpoint, but we can get usage and subscription info
    
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    // Format dates for OpenAI API
    const startDate = startOfMonth.toISOString().split('T')[0]
    const endDate = endOfMonth.toISOString().split('T')[0]
    
    // Fetch current month usage
    const usageResponse = await fetch(`https://api.openai.com/v1/usage?start_date=${startDate}&end_date=${endDate}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    let usageData = null
    let totalCost = 0
    
    if (usageResponse.ok) {
      usageData = await usageResponse.json()
      // Calculate total cost from usage data
      if (usageData.data) {
        totalCost = usageData.data.reduce((sum: number, day: { n_requests: number }) => sum + (day.n_requests * 0.001), 0) // Rough estimate
      }
    }
    
    // Fetch subscription/billing info (this endpoint might not be available in all OpenAI accounts)
    let subscriptionData = null
    try {
      const subscriptionResponse = await fetch('https://api.openai.com/v1/billing/subscription', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (subscriptionResponse.ok) {
        subscriptionData = await subscriptionResponse.json()
      }
    } catch {
      // Subscription endpoint might not be available
      console.log('Subscription endpoint not available')
    }
    
    // Try to get balance from billing endpoint
    let balance = null
    try {
      const balanceResponse = await fetch('https://api.openai.com/dashboard/billing/credit_grants', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json()
        if (balanceData.total_available) {
          balance = balanceData.total_available
        }
      }
    } catch {
      // Balance endpoint might not be available
      console.log('Balance endpoint not available')
    }
    
    return NextResponse.json({
      provider: 'OpenAI',
      balance: balance,
      currency: 'USD',
      lastUpdated: new Date().toISOString(),
      usage: {
        period: `${startDate} to ${endDate}`,
        amount: totalCost,
        limit: subscriptionData?.hard_limit_usd || null
      },
      note: balance === null ? 'Balance not available through API. Monitor usage through OpenAI dashboard.' : undefined,
      dashboardUrl: 'https://platform.openai.com/usage'
    })
    
  } catch (error) {
    console.error('OpenAI balance fetch error:', error)
    
    return NextResponse.json({
      provider: 'OpenAI',
      balance: null,
      currency: 'USD',
      error: 'Unable to fetch balance information',
      lastUpdated: new Date().toISOString(),
      note: 'Monitor usage and billing through OpenAI dashboard: https://platform.openai.com/usage',
      dashboardUrl: 'https://platform.openai.com/usage'
    })
  }
}