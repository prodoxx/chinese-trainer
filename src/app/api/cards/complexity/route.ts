import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import DeckCard from '@/lib/db/models/DeckCard';
import Review from '@/lib/db/models/Review';
import { analyzeCharacterWithDictionary } from '@/lib/analytics/enhanced-linguistic-complexity';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const deckId = searchParams.get('deckId');
    
    let cards;
    if (deckId) {
      // Get cards from specific deck
      const deckCards = await DeckCard.find({ deckId }).populate('cardId');
      cards = deckCards.map((dc: any) => dc.cardId).filter(Boolean);
    } else {
      // Get all cards
      cards = await Card.find().limit(50); // Limit for performance
    }
    
    // Analyze each card
    const analyzedCards = await Promise.all(
      cards.map(async (card) => {
        const complexity = await analyzeCharacterWithDictionary(card.hanzi);
        
        // Get review stats
        const review = await Review.findOne({ cardId: card._id });
        
        return {
          id: card._id,
          hanzi: card.hanzi,
          pinyin: card.pinyin,
          meaning: card.meaning,
          imageUrl: card.imageUrl,
          complexity: {
            overall: complexity.overallDifficulty,
            visual: complexity.visualComplexity,
            phonetic: complexity.phoneticTransparency,
            semantic: complexity.semanticTransparency,
            strokeCount: complexity.strokeCount,
            components: complexity.componentCount,
            frequency: complexity.frequency,
            category: complexity.semanticCategory,
            type: complexity.concreteAbstract,
          },
          performance: review ? {
            seen: review.seen || 0,
            correct: review.correct || 0,
            accuracy: review.seen > 0 ? (review.correct / review.seen) * 100 : 0,
            ease: review.ease || 2.5,
          } : null,
        };
      })
    );
    
    // Sort by difficulty
    analyzedCards.sort((a, b) => b.complexity.overall - a.complexity.overall);
    
    return NextResponse.json({
      success: true,
      cards: analyzedCards,
      summary: {
        total: analyzedCards.length,
        avgDifficulty: analyzedCards.reduce((sum, c) => sum + c.complexity.overall, 0) / analyzedCards.length,
        distribution: {
          easy: analyzedCards.filter(c => c.complexity.overall < 0.3).length,
          medium: analyzedCards.filter(c => c.complexity.overall >= 0.3 && c.complexity.overall < 0.6).length,
          hard: analyzedCards.filter(c => c.complexity.overall >= 0.6).length,
        },
      },
    });
    
  } catch (error) {
    console.error('Complexity analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze complexity' },
      { status: 500 }
    );
  }
}