import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const verified = searchParams.get('verified') || 'all'

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (verified !== 'all') {
      where.emailVerified = verified === 'verified' ? { not: null } : null
    }

    // Get total count
    const totalUsers = await prisma.user.count({ where })

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        role: true,
        createdAt: true,
        settings: {
          select: {
            showFlashDemo: true,
            reduceMotion: true,
            brightness: true
          }
        },
        _count: {
          select: { accounts: true }
        }
      }
    })

    // Calculate stats
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      verifiedCount,
      adminCount,
      todayCount,
      weekCount,
      monthCount
    ] = await Promise.all([
      prisma.user.count({ where: { emailVerified: { not: null } } }),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } })
    ])

    const stats = {
      totalUsers: await prisma.user.count(),
      verifiedUsers: verifiedCount,
      unverifiedUsers: (await prisma.user.count()) - verifiedCount,
      adminUsers: adminCount,
      newUsersToday: todayCount,
      newUsersThisWeek: weekCount,
      newUsersThisMonth: monthCount
    }

    return NextResponse.json({
      users,
      stats,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page
    })

  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}