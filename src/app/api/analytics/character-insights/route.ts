import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { analyzeCharacterWithOpenAI, analyzeConfusionPatterns } from '@/lib/analytics/openai-linguistic-analysis';
import { analyzeCharacterWithDictionary, calculateEnhancedConfusionProbability } from '@/lib/analytics/enhanced-linguistic-complexity';
import Review from '@/lib/db/models/Review';
import Card from '@/lib/db/models/Card';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { characterId, includeAI = false } = await request.json();
    
    // Validate characterId
    if (!characterId || characterId === '') {
      return NextResponse.json(
        { success: false, error: 'Character ID is required' },
        { status: 400 }
      );
    }
    
    // Get the character
    const card = await Card.findById(characterId);
    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Character not found' },
        { status: 404 }
      );
    }
    
    // Get basic linguistic analysis
    const complexityAnalysis = await analyzeCharacterWithDictionary(card.hanzi);
    
    // Get review history for this character
    const review = await Review.findOne({ cardId: characterId });
    const reviewHistory = review ? {
      seen: review.seen || 0,
      correct: review.correct || 0,
      accuracy: review.seen > 0 ? (review.correct / review.seen) * 100 : 0,
      avgResponseTime: review.avgResponseMs || 0,
      lastReviewed: review.lastReviewedAt,
      nextDue: review.due,
      difficulty: review.ease || 2.5,
    } : null;
    
    let aiInsights = null;
    if (includeAI) {
      try {
        aiInsights = await analyzeCharacterWithOpenAI(card.hanzi);
      } catch (error) {
        console.error('AI analysis failed:', error);
      }
    }
    
    // Find commonly confused characters
    const allCards = await Card.find({ _id: { $ne: characterId } }).limit(100);
    const confusionAnalysis = [];
    
    for (const otherCard of allCards.slice(0, 5)) { // Top 5 for performance
      const confusion = await calculateEnhancedConfusionProbability(
        card.hanzi,
        otherCard.hanzi
      );
      
      if (confusion.total > 0.3) { // Only include if confusion probability > 30%
        confusionAnalysis.push({
          character: otherCard.hanzi,
          meaning: otherCard.meaning,
          pinyin: otherCard.pinyin,
          confusion,
        });
      }
    }
    
    // Sort by confusion probability
    confusionAnalysis.sort((a, b) => b.confusion.total - a.confusion.total);
    
    return NextResponse.json({
      success: true,
      insights: {
        character: {
          hanzi: card.hanzi,
          pinyin: card.pinyin,
          meaning: card.meaning,
          imageUrl: card.imageUrl,
        },
        complexity: complexityAnalysis,
        reviewHistory,
        confusionAnalysis: confusionAnalysis.slice(0, 3), // Top 3
        aiInsights,
      },
    });
    
  } catch (error) {
    console.error('Character insights error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get character insights' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get overall confusion patterns from all reviews
    const reviews = await Review.find({
      seen: { $gt: 0 },
      $expr: { $lt: ["$correct", "$seen"] }, // Has errors - correct answers less than total seen
    }).populate('cardId').limit(100);
    
    // Build error history
    const errorPatterns = new Map<string, { errorRate: number; characterId: string }>();
    
    for (const review of reviews) {
      if (review.cardId && review.seen && review.correct !== undefined) {
        const errorRate = 1 - (review.correct / review.seen);
        if (errorRate > 0.2) { // More than 20% error rate
          errorPatterns.set(review.cardId.hanzi, {
            errorRate,
            characterId: review.cardId._id.toString()
          });
        }
      }
    }
    
    // Get difficulty distribution
    const allReviews = await Review.find({}).populate('cardId');
    const difficultyDistribution = {
      easy: 0,
      medium: 0,
      hard: 0,
      veryHard: 0,
    };
    
    for (const review of allReviews) {
      if (review.cardId) {
        const analysis = await analyzeCharacterWithDictionary(review.cardId.hanzi);
        
        if (analysis.overallDifficulty < 0.3) difficultyDistribution.easy++;
        else if (analysis.overallDifficulty < 0.5) difficultyDistribution.medium++;
        else if (analysis.overallDifficulty < 0.7) difficultyDistribution.hard++;
        else difficultyDistribution.veryHard++;
      }
    }
    
    return NextResponse.json({
      success: true,
      patterns: {
        mostDifficult: Array.from(errorPatterns.entries())
          .sort(([, a], [, b]) => b.errorRate - a.errorRate)
          .slice(0, 10)
          .map(([character, data]) => ({ 
            character, 
            errorRate: data.errorRate,
            characterId: data.characterId 
          })),
        difficultyDistribution,
        totalAnalyzed: allReviews.length,
      },
    });
    
  } catch (error) {
    console.error('Pattern analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze patterns' },
      { status: 500 }
    );
  }
}