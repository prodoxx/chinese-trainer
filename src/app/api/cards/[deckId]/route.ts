import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import DeckCard from '@/lib/db/models/DeckCard';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ deckId: string }> }
) {
  try {
    await connectDB();
    
    const { deckId } = await context.params;
    const cached = request.nextUrl.searchParams.get('cached') === 'true';
    
    // Find all card associations for this deck
    const deckCards = await DeckCard.find({ deckId }).populate('cardId');
    
    // Extract the cards and filter by cached status if needed
    let cards = deckCards.map(dc => dc.cardId).filter(card => card);
    
    if (cached) {
      cards = cards.filter(card => (card as any).cached === true);
    }
    
    // Limit to 50 cards
    cards = cards.slice(0, 50);
    
    return NextResponse.json({
      cards: cards.map(card => ({
        id: card._id,
        hanzi: card.hanzi,
        meaning: card.meaning,
        pinyin: card.pinyin,
        imageUrl: card.imageUrl,
        imageAttribution: card.imageAttribution,
        imageAttributionUrl: card.imageAttributionUrl,
        audioUrl: card.audioUrl,
        cached: card.cached,
      }))
    });
    
  } catch (error) {
    console.error('Get cards error:', error);
    return NextResponse.json({ error: 'Failed to get cards' }, { status: 500 });
  }
}