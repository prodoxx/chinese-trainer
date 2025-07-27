import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Review from '@/lib/db/models/Review';
import DeckCard from '@/lib/db/models/DeckCard';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = req.nextUrl.searchParams;
    const deckId = searchParams.get('deckId');
    
    if (!deckId) {
      return NextResponse.json({ error: 'deckId required' }, { status: 400 });
    }
    
    // Get all reviews for this deck
    const reviews = await Review.find({ deckId }).populate('cardId');
    
    // Get all deck cards
    const deckCards = await DeckCard.find({ deckId }).populate('cardId');
    
    // Get reviews by cardId
    const cardIds = deckCards.map(dc => dc.cardId?._id).filter(id => id);
    const reviewsByCard = await Review.find({ cardId: { $in: cardIds } });
    
    return NextResponse.json({
      deckId,
      totalDeckCards: deckCards.length,
      reviewsByDeckId: reviews.length,
      reviewsByCardId: reviewsByCard.length,
      reviewsWithSeen: reviews.filter(r => r.seen > 0).length,
      reviewsWithFirstStudied: reviews.filter(r => r.firstStudiedAt).length,
      sampleReviews: reviews.slice(0, 5).map(r => ({
        cardId: r.cardId,
        deckId: r.deckId,
        seen: r.seen,
        correct: r.correct,
        firstStudiedAt: r.firstStudiedAt,
        createdAt: r.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Debug reviews error:', error);
    return NextResponse.json({ error: 'Failed to debug reviews' }, { status: 500 });
  }
}