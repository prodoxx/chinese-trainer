import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import Deck from '@/lib/db/models/Deck';
import Review from '@/lib/db/models/Review';
import DeckCard from '@/lib/db/models/DeckCard';

// Ensure Card model is registered
void Card;

export async function GET(
  req: NextRequest,
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
    
    // Get all cards in the deck
    const deckCards = await DeckCard.find({ deckId }).populate('cardId');
    const cards = deckCards.map(dc => dc.cardId).filter(card => card && card._id);
    
    console.log('Practice endpoint - Cards in deck:', cards.length);
    
    if (cards.length === 0) {
      console.log('No cards found in deck:', deckId);
      return NextResponse.json({ cards: [], totalCards: 0 });
    }
    
    // Get all reviews for cards in this deck
    const cardIds = cards.map(c => c._id);
    
    // Get reviews for current user only
    const reviews = await Review.find({ 
      userId: session.user.id,
      $or: [
        { cardId: { $in: cardIds } },
        { deckId: deckId }
      ]
    });
    
    console.log('Practice endpoint - Reviews found:', {
      reviews: reviews.length,
      totalCards: cards.length
    });
    
    // Create review map
    const reviewMap = new Map();
    reviews.forEach(r => {
      reviewMap.set(r.cardId.toString(), r);
    });
    
    const allReviews = Array.from(reviewMap.values());
    const reviewsWithSeen = allReviews.filter(r => r.seen > 0);
    
    console.log('Practice endpoint - Reviews with seen > 0:', reviewsWithSeen.length);
    
    if (reviewsWithSeen.length === 0) {
      console.log('No cards have been reviewed yet');
      return NextResponse.json({ cards: [], totalCards: 0 });
    }
    
    // Get cards that have been reviewed
    const reviewedCardIds = new Set(reviewsWithSeen.map(r => r.cardId.toString()));
    const studiedCards = cards.filter(card => reviewedCardIds.has(card._id.toString()));
    
    console.log('Practice endpoint - Final studied cards:', studiedCards.length);
    
    // Shuffle for random practice
    const shuffledCards = [...studiedCards].sort(() => Math.random() - 0.5);
    
    return NextResponse.json({
      cards: shuffledCards.map(card => ({
        id: card._id,
        hanzi: card.hanzi,
        meaning: card.meaning,
        pinyin: card.pinyin,
        imageUrl: card.imageUrl,
        imageAttribution: card.imageAttribution,
        imageAttributionUrl: card.imageAttributionUrl,
        audioUrl: card.audioUrl,
        cached: card.cached,
      })),
      totalCards: shuffledCards.length
    });
    
  } catch (error) {
    console.error('Get practice cards error - full details:', error);
    // Return empty array instead of error to prevent UI issues
    return NextResponse.json({ cards: [], totalCards: 0 });
  }
}