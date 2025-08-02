import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cardEnrichmentQueue } from '@/lib/queue/queues'
import Card from '@/lib/db/models/Card'
import DeckCard from '@/lib/db/models/DeckCard'
import connectDB from '@/lib/db/mongodb'

export async function POST(request: NextRequest) {
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
    
    const { cardIds, deckId } = await request.json()
    
    if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
      return NextResponse.json(
        { error: 'Card IDs are required' },
        { status: 400 }
      )
    }
    
    // Get cards info
    const cards = await Card.find({ _id: { $in: cardIds } })
    
    if (cards.length === 0) {
      return NextResponse.json({ error: 'No cards found' }, { status: 404 })
    }
    
    // Update all cards status to pending
    await Card.updateMany(
      { _id: { $in: cardIds } },
      { 
        enrichmentStatus: 'pending',
        lastEnriched: new Date()
      }
    )
    
    // Queue enrichment jobs for each card
    const jobs = await Promise.all(
      cards.map(async (card) => {
        // If deckId is not provided, try to find it from DeckCard
        let finalDeckId = deckId
        if (!finalDeckId) {
          const deckCard = await DeckCard.findOne({ cardId: card._id }).lean()
          if (deckCard) {
            finalDeckId = deckCard.deckId.toString()
          }
        }
        
        return cardEnrichmentQueue().add(
          `admin-bulk-re-enrich-${card._id}`,
          {
            cardId: card._id.toString(),
            hanzi: card.hanzi,
            deckId: finalDeckId,
            userId: session.user.id,
            force: true
          }
        )
      })
    )
    
    return NextResponse.json({
      success: true,
      jobCount: jobs.length,
      message: `Re-enrichment started for ${jobs.length} cards`
    })
    
  } catch (error) {
    console.error('Admin bulk re-enrich error:', error)
    return NextResponse.json(
      { error: 'Failed to start bulk re-enrichment' },
      { status: 500 }
    )
  }
}