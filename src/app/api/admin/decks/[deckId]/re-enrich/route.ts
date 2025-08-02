import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { deckEnrichmentQueue } from '@/lib/queue/queues'
import Deck from '@/lib/db/models/Deck'
import connectDB from '@/lib/db/mongodb'

export async function POST(
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
    const { force = true } = await request.json()
    
    // Get deck info
    const deck = await Deck.findById(deckId)
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
    }
    
    // Update deck status to enriching
    await Deck.findByIdAndUpdate(deckId, {
      status: 'enriching',
      enrichmentProgress: {
        totalCards: deck.cardsCount,
        processedCards: 0,
        currentOperation: 'Starting admin-triggered re-enrichment...',
      }
    })
    
    // Queue the enrichment job
    const job = await deckEnrichmentQueue().add(
      `admin-re-enrich-${deckId}`,
      {
        deckId,
        userId: deck.userId,
        deckName: deck.name,
        sessionId: `admin-${session.user.id}-${Date.now()}`,
        force
      }
    )
    
    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: `Re-enrichment started for deck "${deck.name}"`
    })
    
  } catch (error) {
    console.error('Admin re-enrich error:', error)
    return NextResponse.json(
      { error: 'Failed to start re-enrichment' },
      { status: 500 }
    )
  }
}