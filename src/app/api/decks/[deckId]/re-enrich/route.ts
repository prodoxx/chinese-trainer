import { NextRequest, NextResponse } from 'next/server';
import { deckEnrichmentQueue } from '@/lib/queue/queues';
import Deck from '@/lib/db/models/Deck';
import connectDB from '@/lib/db/mongodb';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ deckId: string }> }
) {
  try {
    await connectDB();
    
    const { deckId } = await context.params;
    const { force = false, sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }
    
    // Get deck info
    const deck = await Deck.findById(deckId);
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    
    // Update deck status to enriching
    await Deck.findByIdAndUpdate(deckId, {
      status: 'enriching',
      enrichmentProgress: {
        totalCards: deck.cardsCount,
        processedCards: 0,
        currentOperation: 'Starting re-enrichment...',
      }
    });
    
    // Queue the enrichment job
    const job = await deckEnrichmentQueue.add(
      `re-enrich-${deckId}`,
      {
        deckId,
        deckName: deck.name,
        sessionId,
        force,
      },
      {
        jobId: `re-enrich-${deckId}-${Date.now()}`,
      }
    );
    
    return NextResponse.json({
      jobId: job.id,
      status: 'queued',
      message: 'Re-enrichment job queued successfully',
    });
    
  } catch (error) {
    console.error('Re-enrichment error:', error);
    return NextResponse.json({ error: 'Re-enrichment failed' }, { status: 500 });
  }
}