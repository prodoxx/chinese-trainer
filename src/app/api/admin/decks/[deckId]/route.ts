import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db/mongodb'
import Deck from '@/lib/db/models/Deck'
import Card from '@/lib/db/models/Card'
import DeckCard from '@/lib/db/models/DeckCard'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ deckId: string }> }
) {
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
    
    const { deckId } = await context.params
    
    // Get deck with basic info
    const deck = await Deck.findById(deckId).lean()
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
    }
    
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: deck.userId },
      select: { id: true, email: true, name: true }
    })
    
    // Get all cards for this deck through DeckCard junction table
    const deckCards = await DeckCard.find({ deckId }).lean()
    const cardIds = deckCards.map(dc => dc.cardId)
    
    // Get the actual cards
    const cards = await Card.find({ _id: { $in: cardIds } }).sort({ createdAt: 1 }).lean()
    
    // Clear enrichmentProgress if deck is ready (to fix UI issue)
    const deckData = {
      ...deck,
      enrichmentProgress: deck.status === 'ready' ? null : deck.enrichmentProgress
    }
    
    return NextResponse.json({
      ...deckData,
      user,
      cards
    })
    
  } catch (error) {
    console.error('Admin deck detail API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deck details' },
      { status: 500 }
    )
  }
}