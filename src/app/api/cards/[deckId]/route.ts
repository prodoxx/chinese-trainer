import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import Deck from '@/lib/db/models/Deck';
import DeckCard from '@/lib/db/models/DeckCard';
import Review from '@/lib/db/models/Review';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ deckId: string }> }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { deckId } = await context.params;
    
    // Verify user owns this deck
    const deck = await Deck.findOne({ _id: deckId, userId: session.user.id });
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    
    // Find all card associations for this deck
    const deckCards = await DeckCard.find({ deckId });
    const cardIds = deckCards.map(dc => dc.cardId);
    
    // Fetch the actual cards
    let cards = await Card.find({ _id: { $in: cardIds } });
    
    // Get reviews for current user to filter out studied cards
    const reviews = await Review.find({ 
      userId: session.user.id,
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