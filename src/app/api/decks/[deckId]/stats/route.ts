import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Review from '@/lib/db/models/Review';
import DeckCard from '@/lib/db/models/DeckCard';
import { calculateDeckStats, calculateMemoryStrength, getCardsForReview } from '@/lib/spaced-repetition/sm2';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    await connectDB();
    
    const { deckId } = await params;
    
    // Get all cards in the deck
    const deckCards = await DeckCard.find({ deckId }).select('cardId');
    const cardIds = deckCards.map(dc => dc.cardId);
    
    // Get all reviews for this deck
    const reviews = await Review.find({ deckId }).lean();
    
    // Create review records for cards without reviews
    const reviewedCardIds = new Set(reviews.map(r => r.cardId.toString()));
    const unreviewedCardIds = cardIds.filter(id => !reviewedCardIds.has(id.toString()));
    
    // Count new cards (no review record or not studied yet)
    const newCardCount = unreviewedCardIds.length + 
      reviews.filter(r => !r.firstStudiedAt).length;
    
    // Only include studied cards in stats
    const studiedReviews = reviews.filter(r => r.firstStudiedAt);
    
    // Map studied reviews for stats calculation
    const studiedReviewsForStats = studiedReviews.map(r => ({
      cardId: r.cardId.toString(),
      deckId: r.deckId,
      ease: r.ease,
      intervalDays: r.intervalDays,
      repetitions: r.repetitions,
      due: r.due,
      seen: r.seen,
      correct: r.correct,
      avgResponseMs: r.avgResponseMs,
      lastReviewedAt: r.lastReviewedAt || r.createdAt,
      memoryStrength: calculateMemoryStrength({
        ease: r.ease,
        intervalDays: r.intervalDays,
        repetitions: r.repetitions,
        due: r.due,
        lastReviewedAt: r.lastReviewedAt || r.createdAt,
      }),
    }));
    
    // Calculate deck statistics (only for studied cards)
    const stats = calculateDeckStats(studiedReviewsForStats);
    
    // Add new card count to stats
    const statsWithNew = {
      ...stats,
      newCards: newCardCount,
      totalCards: cardIds.length,
    };
    
    // Get cards for review (only studied cards)
    const cardsForReview = getCardsForReview(studiedReviewsForStats, 20);
    
    // Calculate heat map data for the last 30 days
    const heatMapData = calculateHeatMapData(studiedReviews);
    
    return NextResponse.json({
      stats: statsWithNew,
      cardsForReview,
      heatMapData,
      totalCards: cardIds.length,
      studiedCards: studiedReviews.length,
      newCards: newCardCount,
    });
  } catch (error) {
    console.error('Failed to get deck stats:', error);
    return NextResponse.json(
      { error: 'Failed to get deck statistics' },
      { status: 500 }
    );
  }
}

interface ReviewData {
  lastReviewedAt?: Date;
}

function calculateHeatMapData(reviews: any[]) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const heatMap: Record<string, number> = {};
  
  reviews.forEach(review => {
    if (review.lastReviewedAt && review.lastReviewedAt > thirtyDaysAgo) {
      const dateKey = review.lastReviewedAt.toISOString().split('T')[0];
      heatMap[dateKey] = (heatMap[dateKey] || 0) + 1;
    }
  });
  
  return heatMap;
}