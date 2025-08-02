import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db/mongodb'
import Deck from '@/lib/db/models/Deck'
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

    await connectDB()

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    // Build query
    const query: any = {}
    
    if (status !== 'all') {
      query.status = status
    }

    // For search, we need to get user IDs first if searching by email
    let userIds: string[] = []
    if (search) {
      // Try to find users by email
      const users = await prisma.user.findMany({
        where: {
          email: { contains: search, mode: 'insensitive' }
        },
        select: { id: true }
      })
      userIds = users.map(u => u.id)

      // Build OR query for deck name or user ID
      if (userIds.length > 0) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { userId: { $in: userIds } }
        ]
      } else {
        query.name = { $regex: search, $options: 'i' }
      }
    }

    // Get total count
    const totalDecks = await Deck.countDocuments(query)

    // Get decks with pagination
    const decks = await Deck.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    // Get user information for each deck
    const userIds2 = [...new Set(decks.map(d => d.userId))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds2 } },
      select: { id: true, email: true, name: true }
    })

    const userMap = new Map(users.map(u => [u.id, u]))

    // Add user info to decks
    const decksWithUsers = decks.map(deck => ({
      ...deck,
      user: userMap.get(deck.userId)
    }))

    // Calculate stats
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalDecksCount,
      totalCardsCount,
      readyCount,
      importingCount,
      enrichingCount,
      failedCount,
      todayCount,
      weekCount,
      monthCount
    ] = await Promise.all([
      Deck.countDocuments(),
      Deck.aggregate([{ $group: { _id: null, total: { $sum: '$cardsCount' } } }]).then(r => r[0]?.total || 0),
      Deck.countDocuments({ status: 'ready' }),
      Deck.countDocuments({ status: 'importing' }),
      Deck.countDocuments({ status: 'enriching' }),
      Deck.countDocuments({ status: 'failed' }),
      Deck.countDocuments({ createdAt: { $gte: todayStart } }),
      Deck.countDocuments({ createdAt: { $gte: weekStart } }),
      Deck.countDocuments({ createdAt: { $gte: monthStart } })
    ])

    const stats = {
      totalDecks: totalDecksCount,
      totalCards: totalCardsCount,
      readyDecks: readyCount,
      importingDecks: importingCount,
      enrichingDecks: enrichingCount,
      failedDecks: failedCount,
      decksToday: todayCount,
      decksThisWeek: weekCount,
      decksThisMonth: monthCount
    }

    return NextResponse.json({
      decks: decksWithUsers,
      stats,
      totalPages: Math.ceil(totalDecks / limit),
      currentPage: page
    })

  } catch (error) {
    console.error('Admin decks API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch decks' },
      { status: 500 }
    )
  }
}