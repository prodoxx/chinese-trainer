import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { analyzeCharacterWithOpenAI, analyzeConfusionPatterns } from '@/lib/analytics/openai-linguistic-analysis';
import { getCharacterAnalysisWithCache, getSimilarCharacters } from '@/lib/analytics/character-analysis-service';
import { calculateEnhancedConfusionProbability } from '@/lib/analytics/enhanced-linguistic-complexity';
import Review from '@/lib/db/models/Review';
import Card from '@/lib/db/models/Card';
import CharacterAnalysis from '@/lib/db/models/CharacterAnalysis';
import Dictionary from '@/lib/db/models/Dictionary';
import { convertPinyinToneNumbersToMarks, hasToneMarks } from '@/lib/utils/pinyin';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const timings: Record<string, number> = {};
  
  try {
    const connectStart = Date.now();
    await connectDB();
    timings.dbConnect = Date.now() - connectStart;
    
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
    
    // Get linguistic analysis - prefer card data, then use cache service
    const analysisStart = Date.now();
    let complexityAnalysis;
    
    // Check if card already has linguistic data
    if (card.semanticCategory && card.tonePattern) {
      // Use card's stored data
      complexityAnalysis = {
        character: card.hanzi,
        pinyin: card.pinyin,
        definitions: [card.meaning],
        strokeCount: card.strokeCount || 0,
        radicalCount: 0,
        componentCount: card.componentCount || 0,
        characterLength: card.hanzi.length,
        isPhonetic: false,
        isSemantic: true,
        semanticCategory: card.semanticCategory,
        phoneticComponent: undefined,
        tonePattern: card.tonePattern,
        toneDifficulty: 0.5,
        semanticFields: [],
        concreteAbstract: 'concrete',
        polysemy: 1,
        frequency: 3,
        contextDiversity: 1,
        visualComplexity: card.visualComplexity || 0.5,
        phoneticTransparency: 0.5,
        semanticTransparency: 0.7,
        overallDifficulty: card.overallDifficulty || 0.5
      };
      timings.linguisticAnalysis = Date.now() - analysisStart;
      console.log(`Linguistic analysis from card took ${timings.linguisticAnalysis}ms`);
    } else {
      // Fall back to analysis service
      complexityAnalysis = await getCharacterAnalysisWithCache(card.hanzi);
      timings.linguisticAnalysis = Date.now() - analysisStart;
      console.log(`Linguistic analysis from service took ${timings.linguisticAnalysis}ms`);
    }
    
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
        // Check if AI insights are already cached in the card
        if (card.aiInsights && card.aiInsightsGeneratedAt) {
          // Check if cached insights are recent (less than 30 days old)
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          if (card.aiInsightsGeneratedAt > thirtyDaysAgo) {
            console.log('Using cached AI insights for character:', card.hanzi);
            aiInsights = card.aiInsights;
          }
        }
        
        // If no cached insights or they're stale, generate new ones
        if (!aiInsights) {
          console.log('Generating new AI insights for character:', card.hanzi);
          aiInsights = await analyzeCharacterWithOpenAI(card.hanzi);
          
          // Cache the AI insights in the card
          await Card.findByIdAndUpdate(characterId, {
            aiInsights,
            aiInsightsGeneratedAt: new Date(),
          });
        }
      } catch (error) {
        console.error('AI analysis failed:', error);
      }
    }
    
    // Skip confusion analysis for now - it's too slow
    // TODO: Implement a faster confusion analysis or move to background job
    let confusionAnalysis = [];
    
    const confusionStart = Date.now();
    
    // For now, just get commonly confused characters from the cache if available
    try {
      const cachedAnalysis = await CharacterAnalysis.findOne({ character: card.hanzi });
      if (cachedAnalysis?.commonConfusions) {
        // Filter out the character itself and get unique characters
        const uniqueConfusions = cachedAnalysis.commonConfusions
          .filter((conf: any) => conf.character !== card.hanzi)
          .slice(0, 3);
        
        // Look up meaning and pinyin for each confused character
        const confusionPromises = uniqueConfusions.map(async (conf: any) => {
          const confusedCard = await Card.findOne({ hanzi: conf.character });
          let meaning = confusedCard?.meaning || '';
          let pinyin = confusedCard?.pinyin || '';
          
          // If no pinyin/meaning in Card, check Dictionary
          if (!pinyin || !meaning) {
            const dictEntry = await Dictionary.findOne({ traditional: conf.character });
            if (dictEntry) {
              pinyin = pinyin || dictEntry.pinyin || '';
              meaning = meaning || dictEntry.definitions?.[0] || '';
              
              // Convert pinyin tone numbers to marks if needed
              if (pinyin && !hasToneMarks(pinyin)) {
                try {
                  pinyin = convertPinyinToneNumbersToMarks(pinyin);
                } catch (e) {
                  // Keep original if conversion fails
                }
              }
              
              // Background: Create card for this character if it doesn't exist
              if (!confusedCard && pinyin && meaning) {
                Card.create({
                  hanzi: conf.character,
                  pinyin,
                  meaning,
                  cached: false // Will be enriched later
                }).catch(err => {
                  // Ignore duplicate key errors
                  if (err.code !== 11000) {
                    console.error('Error creating card for confusion character:', err);
                  }
                });
              }
            }
          }
          
          return {
            character: conf.character,
            meaning,
            pinyin,
            confusion: {
              visual: conf.similarity,
              semantic: 0,
              phonetic: 0,
              tonal: 0,
              total: conf.similarity
            }
          };
        });
        
        confusionAnalysis = await Promise.all(confusionPromises);
      }
      
      // If no confusion data or only self-references, try to find similar characters
      if (confusionAnalysis.length === 0 && card.hanzi) {
        // For multi-character words, find other words with similar characters
        if (card.hanzi.length > 1) {
          // Find cards that share at least one character
          const similarCards = await Card.find({
            hanzi: { $ne: card.hanzi },
            $or: card.hanzi.split('').map((char: string) => ({ hanzi: new RegExp(char) }))
          }).limit(3);
          
          confusionAnalysis = await Promise.all(similarCards.map(async similar => {
            let meaning = similar.meaning || '';
            let pinyin = similar.pinyin || '';
            
            // If no pinyin/meaning, check Dictionary
            if (!pinyin || !meaning) {
              const dictEntry = await Dictionary.findOne({ traditional: similar.hanzi });
              if (dictEntry) {
                pinyin = pinyin || dictEntry.pinyin || '';
                meaning = meaning || dictEntry.definitions?.[0] || '';
                
                // Convert pinyin tone numbers to marks if needed
                if (pinyin && !hasToneMarks(pinyin)) {
                  try {
                    pinyin = convertPinyinToneNumbersToMarks(pinyin);
                  } catch (e) {
                    // Keep original if conversion fails
                  }
                }
              }
            }
            
            return {
              character: similar.hanzi,
              meaning,
              pinyin,
              confusion: {
                visual: 0.5, // Default medium confusion
                semantic: 0.3,
                phonetic: 0.2,
                tonal: 0.1,
                total: 0.5
              }
            };
          }));
        } else {
          // For single characters, find visually similar ones
          const visuallySimilar = ['生', '牛', '午', '半'].includes(card.hanzi) ? 
            ['生', '牛', '午', '半'].filter(c => c !== card.hanzi) : [];
          
          if (visuallySimilar.length > 0) {
            const similarCards = await Card.find({ hanzi: { $in: visuallySimilar } }).limit(3);
            confusionAnalysis = await Promise.all(similarCards.map(async similar => {
              let meaning = similar.meaning || '';
              let pinyin = similar.pinyin || '';
              
              // If no pinyin/meaning, check Dictionary
              if (!pinyin || !meaning) {
                const dictEntry = await Dictionary.findOne({ traditional: similar.hanzi });
                if (dictEntry) {
                  pinyin = pinyin || dictEntry.pinyin || '';
                  meaning = meaning || dictEntry.definitions?.[0] || '';
                  
                  // Convert pinyin tone numbers to marks if needed
                  if (pinyin && !hasToneMarks(pinyin)) {
                    try {
                      pinyin = convertPinyinToneNumbersToMarks(pinyin);
                    } catch (e) {
                      // Keep original if conversion fails
                    }
                  }
                }
              }
              
              return {
                character: similar.hanzi,
                meaning,
                pinyin,
                confusion: {
                  visual: 0.7,
                  semantic: 0.1,
                  phonetic: 0.1,
                  tonal: 0.1,
                  total: 0.6
                }
              };
            }));
          }
        }
      }
      
      timings.totalConfusion = Date.now() - confusionStart;
    } catch (error) {
      console.error('Confusion analysis error:', error);
      timings.totalConfusion = Date.now() - confusionStart;
    }
    
    timings.total = Date.now() - startTime;
    console.log('Character insights timings:', timings);
    
    const response = NextResponse.json({
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
    
    response.headers.set('X-Response-Time', `${timings.total}ms`);
    return response;
    
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
        // Skip difficulty analysis for now - it's not needed for this endpoint
        const analysis = { overallDifficulty: 0.5 }; // Default medium difficulty
        
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