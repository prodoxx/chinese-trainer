import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cardEnrichmentQueue } from '@/lib/queue/queues';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { cardId, deckId, force, disambiguationSelection } = await request.json();
    
    if (!cardId || !deckId) {
      return NextResponse.json(
        { error: 'Card ID and Deck ID required' }, 
        { status: 400 }
      );
    }
    
    // Queue the job with disambiguation selection
    const job = await cardEnrichmentQueue().add(
      `enrich-${cardId}`,
      {
        cardId: cardId,
        userId: session.user.id,
        deckId: deckId,
        force: force || false,
        disambiguationSelection: disambiguationSelection,
      }
    );
    
    return NextResponse.json({
      jobId: job.id,
      message: 'Re-enrichment job queued with your selection'
    });
    
  } catch (error) {
    console.error('Re-enrichment submit error:', error);
    return NextResponse.json(
      { error: 'Re-enrichment submission failed' }, 
      { status: 500 }
    );
  }
}