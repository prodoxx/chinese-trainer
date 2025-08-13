import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Review from '@/lib/db/models/Review';
import Card from '@/lib/db/models/Card';
import Dictionary from '@/lib/db/models/Dictionary';
import { convertPinyinToneNumbersToMarks, hasToneMarks } from '@/lib/utils/pinyin';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const timings: Record<string, number> = {};
  
  try {
    const connectStart = Date.now();
    await connectDB();
    timings.dbConnect = Date.now() - connectStart;
    
    const { characterId } = await request.json();
    
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
    
    // Get all analysis data directly from the card (everything is now in Cards collection)
    const analysisStart = Date.now();
    const complexityAnalysis = {
      character: card.hanzi,
      pinyin: card.pinyin,
      definitions: [card.meaning],
      strokeCount: card.strokeCount || 0,
      radicalCount: card.radicals?.length || 0,
      componentCount: card.componentCount || 0,
      characterLength: card.hanzi.length,
      isPhonetic: false,
      isSemantic: true,
      semanticCategory: card.semanticCategory || 'general',
      semanticFields: card.semanticFields || [],
      conceptType: card.conceptType || 'concrete',
      phoneticComponent: undefined,
      tonePattern: card.tonePattern || '',
      toneDescription: card.toneDescription || '',
      toneDifficulty: card.toneDifficulty || 0.5,
      concreteAbstract: card.conceptType || 'concrete',
      polysemy: 1,
      frequency: card.frequency || 3,
      contextDiversity: card.collocations?.length || 1,
      contextExamples: card.contextExamples || [],
      collocations: card.collocations || [],
      visualComplexity: card.visualComplexity || 0.5,
      phoneticTransparency: card.phoneticTransparency || 0.5,
      semanticTransparency: card.semanticTransparency || 0.7,
      overallDifficulty: card.overallDifficulty || 0.5,
      mnemonics: card.mnemonics || [],
      etymology: card.etymology || '',
      commonConfusions: card.commonConfusions || [],
      radicals: card.radicals || []
    };
    timings.linguisticAnalysis = Date.now() - analysisStart;
    console.log(`Card data retrieval took ${timings.linguisticAnalysis}ms`);
    
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
    
    // Get AI insights directly from the card
    let aiInsights = null;
    
    if (card.aiInsights) {
      // Check if AI insights have actual content (not just empty structure)
      const hasValidContent = card.aiInsights.etymology?.origin && 
        card.aiInsights.mnemonics?.visual && 
        card.aiInsights.learningTips?.forBeginners?.length > 0;
      
      if (hasValidContent) {
        console.log('Using AI insights from Card for:', card.hanzi);
        aiInsights = card.aiInsights;
      } else {
        console.log('Card has empty AI insights structure for:', card.hanzi);
      }
    } else {
      console.log('No AI insights found for character:', card.hanzi, '- should be generated during enrichment');
    }
    
    // Never generate AI insights on-demand anymore - they should only be generated during enrichment
    // This prevents the slow loading when opening the Character Insights modal
    
    // Get confusion analysis from card's commonConfusions field
    let confusionAnalysis = [];
    
    const confusionStart = Date.now();
    
    try {
      if (card.commonConfusions && card.commonConfusions.length > 0) {
        // Filter out the character itself and get unique characters
        const uniqueConfusions = card.commonConfusions
          .filter((conf: { character: string; similarity?: number }) => conf.character !== card.hanzi)
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
                } catch {
                  // Keep original if conversion fails
                }
              }
            }
          }
          
          return {
            character: conf.character,
            meaning,
            pinyin,
            confusion: {
              visual: conf.confusionTypes?.visual || conf.similarity || 0.5,
              semantic: conf.confusionTypes?.semantic || 0,
              phonetic: conf.confusionTypes?.phonetic || 0,
              tonal: conf.confusionTypes?.tonal || 0,
              total: conf.similarity || 0.5
            },
            reasons: conf.reasons || []
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

export async function GET() {
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