import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import Review from '@/lib/db/models/Review';
import DeckCard from '@/lib/db/models/DeckCard';

// Ensure Card model is registered
void Card;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ deckId: string }> }
) {
  try {
    await connectDB();
    
    const { deckId } = await context.params;
    
    // Get all cards in the deck
    const deckCards = await DeckCard.find({ deckId }).populate('cardId');
    const cards = deckCards.map(dc => dc.cardId).filter(card => card && card._id);
    
    console.log('Practice endpoint - Cards in deck:', cards.length);
    
    if (cards.length === 0) {
      console.log('No cards found in deck:', deckId);
      return NextResponse.json({ cards: [] });
    }
    
    // Get all reviews for cards in this deck
    const cardIds = cards.map(c => c._id);
    
    // Try both queries to find reviews
    const reviewsByCardId = await Review.find({ 
      cardId: { $in: cardIds } 
    });
    
    const reviewsByDeckId = await Review.find({ 
      deckId: deckId 
    });
    
    console.log('Practice endpoint - Reviews found:', {
      byCardId: reviewsByCardId.length,
      byDeckId: reviewsByDeckId.length,
      totalCards: cards.length
    });
    
    // Combine and deduplicate reviews
    const reviewMap = new Map();
    [...reviewsByCardId, ...reviewsByDeckId].forEach(r => {
      reviewMap.set(r.cardId.toString(), r);
    });
    
    const allReviews = Array.from(reviewMap.values());
    const reviewsWithSeen = allReviews.filter(r => r.seen > 0);
    
    console.log('Practice endpoint - Reviews with seen > 0:', reviewsWithSeen.length);
    
    if (reviewsWithSeen.length === 0) {
      console.log('No cards have been reviewed yet');
      return NextResponse.json({ cards: [] });
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
      }))
    });
    
  } catch (error) {
    console.error('Get practice cards error - full details:', error);
    // Return empty array instead of error to prevent UI issues
    return NextResponse.json({ cards: [] });
  }
}