import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import Review from '@/lib/db/models/Review';
import DeckCard from '@/lib/db/models/DeckCard';
import { getCardsForReview, calculateMemoryStrength } from '@/lib/spaced-repetition/sm2';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ deckId: string }> }
) {
  try {
    await connectDB();
    
    const { deckId } = await context.params;
    
    // Get all cards in the deck
    const deckCards = await DeckCard.find({ deckId }).populate('cardId');
    const cards = deckCards.map(dc => dc.cardId).filter(card => card);
    
    // Get reviews for these cards
    const cardIds = cards.map(c => c._id);
    const reviews = await Review.find({ cardId: { $in: cardIds } }).lean();
    
    // Create a map of reviews by cardId
    const reviewMap = new Map(
      reviews.map(r => [r.cardId.toString(), r])
    );
    
    // Get cards that need review - only include cards that have been studied
    const reviewData = cards
      .map(card => {
        const review = reviewMap.get(card._id.toString());
        if (!review || !review.firstStudiedAt) {
          // Card hasn't been studied yet - exclude from reviews
          return null;
        }
        return {
          cardId: card._id.toString(),
          ease: review.ease,
          intervalDays: review.intervalDays,
          repetitions: review.repetitions,
          due: review.due,
          lastReviewedAt: review.lastReviewedAt,
        };
      })
      .filter(item => item !== null);
    
    // Get cards for review (due or weak memory)
    const cardsForReview = getCardsForReview(reviewData);
    
    // Map card IDs to full card data
    const reviewCardIds = new Set(cardsForReview.map(c => c.cardId));
    const reviewCards = cards.filter(card => 
      reviewCardIds.has(card._id.toString())
    );
    
    // Add review info to cards
    const enrichedCards = reviewCards.map(card => {
      const reviewInfo = cardsForReview.find(r => r.cardId === card._id.toString());
      const review = reviewMap.get(card._id.toString());
      
      return {
        id: card._id,
        hanzi: card.hanzi,
        meaning: card.meaning,
        pinyin: card.pinyin,
        imageUrl: card.imageUrl,
        imageAttribution: card.imageAttribution,
        imageAttributionUrl: card.imageAttributionUrl,
        audioUrl: card.audioUrl,
        cached: card.cached,
        reviewInfo: {
          overdueDays: reviewInfo?.overdueDays || 0,
          strength: reviewInfo?.strength || 0,
          seen: review?.seen || 0,
          correct: review?.correct || 0,
          accuracy: review?.seen ? (review.correct / review.seen) : 0,
        },
      };
    });
    
    // Sort by review priority (most overdue first, then weakest)
    enrichedCards.sort((a, b) => {
      if (a.reviewInfo.overdueDays !== b.reviewInfo.overdueDays) {
        return b.reviewInfo.overdueDays - a.reviewInfo.overdueDays;
      }
      return a.reviewInfo.strength - b.reviewInfo.strength;
    });
    
    // Limit to optimal session size for better learning outcomes
    const OPTIMAL_SESSION_SIZE = 7;
    const sessionCards = enrichedCards.slice(0, OPTIMAL_SESSION_SIZE);
    
    return NextResponse.json({
      cards: sessionCards,
      totalDue: cardsForReview.length,
      totalCards: sessionCards.length
    });
  } catch (error) {
    console.error('Failed to get review cards:', error);
    return NextResponse.json(
      { error: 'Failed to get review cards' },
      { status: 500 }
    );
  }
}