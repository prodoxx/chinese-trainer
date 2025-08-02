import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cardEnrichmentQueue } from '@/lib/queue/queues'
import Card from '@/lib/db/models/Card'
import DeckCard from '@/lib/db/models/DeckCard'
import connectDB from '@/lib/db/mongodb'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ cardId: string }> }
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
    
    const { cardId } = await context.params
    const { deckId } = await request.json()
    
    // Get card info
    const card = await Card.findById(cardId)
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }
    
    // Update card status to pending
    await Card.findByIdAndUpdate(cardId, {
      enrichmentStatus: 'pending',
      lastEnriched: new Date()
    })
    
    // If deckId is not provided, try to find it from DeckCard
    let finalDeckId = deckId
    if (!finalDeckId) {
      const deckCard = await DeckCard.findOne({ cardId }).lean()
      if (deckCard) {
        finalDeckId = deckCard.deckId.toString()
      }
    }
    
    // Queue the enrichment job
    const job = await cardEnrichmentQueue().add(
      `admin-re-enrich-card-${cardId}`,
      {
        cardId: card._id.toString(),
        hanzi: card.hanzi,
        deckId: finalDeckId,
        userId: session.user.id,
        force: true // Force re-enrichment even if already enriched
      }
    )
    
    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: `Re-enrichment started for card "${card.hanzi}"`
    })
    
  } catch (error) {
    console.error('Admin card re-enrich error:', error)
    return NextResponse.json(
      { error: 'Failed to start re-enrichment' },
      { status: 500 }
    )
  }
}