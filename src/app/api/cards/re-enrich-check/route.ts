import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import Dictionary from '@/lib/db/models/Dictionary';
import { cardEnrichmentQueue } from '@/lib/queue/queues';
import { convertPinyinToneNumbersToMarks } from '@/lib/utils/pinyin';

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

    const { cardId, force = false, deckId } = await request.json();
    
    if (!cardId || !deckId) {
      return NextResponse.json(
        { error: 'Card ID and Deck ID required' }, 
        { status: 400 }
      );
    }

    await connectDB();
    
    // Find the card
    const card = await Card.findById(cardId);
    
    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' }, 
        { status: 404 }
      );
    }
    
    // Check if card has multiple meanings
    const dictEntries = await Dictionary.find({ 
      traditional: card.hanzi 
    });
    
    if (dictEntries.length > 1 && !card.disambiguated) {
      // Return disambiguation options
      return NextResponse.json({
        needsDisambiguation: true,
        character: {
          hanzi: card.hanzi,
          cardId: card._id.toString(),
          meanings: dictEntries.map(entry => ({
            pinyin: convertPinyinToneNumbersToMarks(entry.pinyin),
            meaning: entry.definitions[0] || 'No definition',
            frequency: getFrequencyHint(card.hanzi, entry.pinyin)
          }))
        }
      });
    }
    
    // No disambiguation needed, queue the job directly
    const job = await cardEnrichmentQueue.add(
      `enrich-${cardId}`,
      {
        cardId: cardId,
        userId: session.user.id,
        deckId: deckId,
        force: force,
      }
    );
    
    return NextResponse.json({
      needsDisambiguation: false,
      jobId: job.id,
      message: 'Re-enrichment job queued'
    });
    
  } catch (error) {
    console.error('Re-enrichment check error:', error);
    return NextResponse.json(
      { error: 'Re-enrichment check failed' }, 
      { status: 500 }
    );
  }
}

function getFrequencyHint(hanzi: string, pinyin: string): string {
  const commonPatterns: Record<string, Record<string, string>> = {
    '累': {
      'lei4': 'very common',
      'lei3': 'common'
    },
    '行': {
      'xing2': 'very common',
      'hang2': 'common'
    },
    '长': {
      'zhang3': 'common',
      'chang2': 'very common'
    },
    '得': {
      'de2': 'very common',
      'dei3': 'less common',
      'de5': 'very common'
    }
  };
  
  return commonPatterns[hanzi]?.[pinyin.toLowerCase()] || 'common';
}