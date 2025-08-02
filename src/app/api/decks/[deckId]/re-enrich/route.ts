import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deckEnrichmentQueue } from '@/lib/queue/queues';
import Deck from '@/lib/db/models/Deck';
import connectDB from '@/lib/db/mongodb';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ deckId: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' }, 
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { deckId } = await context.params;
    const { force = false, sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }
    
    // Get deck info for current user
    const deck = await Deck.findOne({ _id: deckId, userId: session.user.id });
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
    const job = await deckEnrichmentQueue().add(
      `re-enrich-${deckId}`,
      {
        deckId,
        userId: session.user.id,
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