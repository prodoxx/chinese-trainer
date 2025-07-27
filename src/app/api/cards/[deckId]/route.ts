import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import DeckCard from '@/lib/db/models/DeckCard';
import Review from '@/lib/db/models/Review';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ deckId: string }> }
) {
  try {
    await connectDB();
    
    const { deckId } = await context.params;
    
    // Find all card associations for this deck
    const deckCards = await DeckCard.find({ deckId });
    const cardIds = deckCards.map(dc => dc.cardId);
    
    // Fetch the actual cards
    let cards = await Card.find({ _id: { $in: cardIds } });
    
    // Get reviews to filter out studied cards
    const reviews = await Review.find({ 
      cardId: { $in: cardIds },
      firstStudiedAt: { $exists: true }
    }).select('cardId');
    
    // Create set of studied card IDs
    const studiedCardIds = new Set(reviews.map(r => r.cardId.toString()));
    
    // Filter out cards that have been studied
    cards = cards.filter(card => !studiedCardIds.has(card._id.toString()));
    
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