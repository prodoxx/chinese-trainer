import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Review from '@/lib/db/models/Review';
import { analyzeCharacterWithDictionary } from '@/lib/analytics/enhanced-linguistic-complexity';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // searchParams and userId are not used in current implementation
    // const searchParams = request.nextUrl.searchParams;
    // const userId = searchParams.get('userId') || 'default'; // In production, get from auth
    
    // Get all reviews to understand learning patterns
    const reviews = await Review.find({}).populate('cardId');
    
    // Analyze performance patterns
    const performanceData = reviews.map(review => ({
      cardId: review.cardId._id,
      hanzi: review.cardId.hanzi,
      accuracy: review.seen > 0 ? review.correct / review.seen : 0,
      seen: review.seen,
      ease: review.ease,
      lastReviewed: review.lastReviewedAt,
    }));
    
    // Find struggling characters (accuracy < 70% OR any incorrect answers)
    const strugglingChars = performanceData
      .filter(p => p.seen > 0 && (p.accuracy < 0.7 || (p.seen > 2 && p.accuracy < 1.0)))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 10);
    
    // Find characters not reviewed recently (> 3 days for high performers)
    const reviewThreshold = performanceData.length > 0 && 
      performanceData.reduce((sum, p) => sum + p.accuracy, 0) / performanceData.length > 0.8 
      ? 3 : 7; // Use shorter threshold for high performers
      
    const needsReview = performanceData
      .filter(p => {
        if (!p.lastReviewed) return true; // Never reviewed
        const daysSince = (Date.now() - new Date(p.lastReviewed).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince > reviewThreshold;
      })
      .slice(0, 10);
    
    // Get complexity analysis for recommendations
    const complexityAnalysis = await Promise.all(
      strugglingChars.slice(0, 5).map(async (char) => {
        const analysis = await analyzeCharacterWithDictionary(char.hanzi);
        return {
          hanzi: char.hanzi,
          difficulty: analysis.overallDifficulty,
          components: analysis.componentCount,
          category: analysis.semanticCategory,
          phoneticComponent: analysis.phoneticComponent,
        };
      })
    );
    
    // Generate personalized recommendations
    const recommendations = {
      immediate: {
        title: "Focus on These Characters",
        description: strugglingChars.length > 0 
          ? "You're struggling with these characters. Practice them in today's session."
          : "Great job! Here are some characters to reinforce:",
        characters: strugglingChars.length > 0 
          ? strugglingChars.slice(0, 5).map(c => ({
              hanzi: c.hanzi,
              accuracy: c.accuracy,
              reason: c.accuracy < 0.5 ? 'Very low accuracy' : c.accuracy < 0.7 ? 'Below target accuracy' : 'Has some errors',
            }))
          : performanceData
              .filter(p => p.seen > 0)
              .sort((a, b) => a.seen - b.seen) // Least practiced
              .slice(0, 5)
              .map(c => ({
                hanzi: c.hanzi,
                accuracy: c.accuracy,
                reason: 'Less practiced',
              })),
      },
      
      review: {
        title: "Due for Review",
        description: "These characters haven't been reviewed recently and may be forgotten.",
        characters: needsReview.slice(0, 5).map(c => ({
          hanzi: c.hanzi,
          daysSince: Math.floor((Date.now() - new Date(c.lastReviewed).getTime()) / (1000 * 60 * 60 * 24)),
        })),
      },
      
      patterns: {
        title: "Learning Patterns",
        insights: generateInsights(performanceData, complexityAnalysis),
      },
      
      strategies: {
        title: "Recommended Strategies",
        tips: generateStrategies(strugglingChars, complexityAnalysis, performanceData),
      },
      
      nextSteps: {
        title: "Next Learning Goals",
        suggestions: generateNextSteps(performanceData, complexityAnalysis),
      },
    };
    
    return NextResponse.json({
      success: true,
      recommendations,
      summary: {
        totalCharacters: performanceData.length,
        avgAccuracy: performanceData.reduce((sum, p) => sum + p.accuracy, 0) / performanceData.length * 100,
        needsWork: strugglingChars.length,
        needsReview: needsReview.length,
      },
    });
    
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

function generateInsights(
  performanceData: Array<{ accuracy: number; hanzi: string; seen: number }>,
  complexityAnalysis: Array<{ difficulty: number; category?: string; hanzi: string }>
): string[] {
  const insights = [];
  
  // Check if visual complexity is an issue
  const visuallyComplex = complexityAnalysis.filter(c => c.difficulty > 0.7);
  if (visuallyComplex.length > 2) {
    insights.push("You struggle more with visually complex characters. Try breaking them down into components.");
  }
  
  // Check for semantic category patterns
  const categories = complexityAnalysis.map(c => c.category).filter(Boolean) as string[];
  const categoryCount = categories.reduce((acc, cat) => {
    if (cat) {
      acc[cat] = (acc[cat] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const sortedCategories = Object.entries(categoryCount)
    .sort(([, a], [, b]) => (b as number) - (a as number));
  
  if (sortedCategories.length > 0) {
    const [categoryName, count] = sortedCategories[0] as [string, number];
    if (count > 2) {
      insights.push(`Many difficult characters are related to "${categoryName}". Focus on this semantic field.`);
    }
  }
  
  // Check accuracy distribution
  const avgAccuracy = performanceData.reduce((sum, p) => sum + p.accuracy, 0) / performanceData.length;
  if (avgAccuracy < 0.7) {
    insights.push("Overall accuracy is below 70%. Consider shorter, more frequent study sessions.");
  } else if (avgAccuracy > 0.85) {
    insights.push("Excellent accuracy! You're ready to increase study pace.");
  }
  
  return insights;
}

function generateStrategies(
  strugglingChars: Array<{ accuracy: number }>,
  complexityAnalysis: Array<{ components?: number; phoneticComponent?: string; difficulty: number }>,
  performanceData: Array<{ accuracy: number }>
): string[] {
  const strategies = [];
  
  // Component-based learning
  if (complexityAnalysis.some(c => (c.components ?? 0) > 3)) {
    strategies.push("Break down complex characters: Study components separately before combining.");
  }
  
  // Phonetic components
  if (complexityAnalysis.some(c => c.phoneticComponent)) {
    strategies.push("Use phonetic components: Many characters share sound components that hint at pronunciation.");
  }
  
  // Practice frequency
  if (strugglingChars.length > 5) {
    strategies.push("Increase practice frequency: Review struggling characters at the start of each session.");
  }
  
  // Context learning
  strategies.push("Learn in context: Create sentences with difficult characters to improve retention.");
  
  // Mnemonic devices
  if (complexityAnalysis.some(c => c.difficulty > 0.6)) {
    strategies.push("Create visual mnemonics: Link character shapes to their meanings with memorable stories.");
  }
  
  // High performer strategies
  const avgAccuracy = performanceData.reduce((sum, p) => sum + p.accuracy, 0) / performanceData.length;
  if (avgAccuracy > 0.9) {
    strategies.push("Challenge yourself: Increase study speed or add more complex characters.");
    strategies.push("Teach others: Explaining characters reinforces your own understanding.");
  }
  
  return strategies;
}

function generateNextSteps(
  performanceData: Array<{ accuracy: number; seen: number }>,
  complexityAnalysis: unknown[]
): string[] {
  const suggestions = [];
  
  const avgAccuracy = performanceData.reduce((sum, p) => sum + p.accuracy, 0) / performanceData.length;
  const totalSeen = performanceData.reduce((sum, p) => sum + p.seen, 0);
  
  if (avgAccuracy > 0.9) {
    suggestions.push("Add more challenging vocabulary from advanced texts");
    suggestions.push("Focus on character combinations and compound words");
    suggestions.push("Practice writing characters from memory");
  }
  
  if (totalSeen < 100) {
    suggestions.push("Increase daily study volume to build stronger foundations");
  }
  
  if (performanceData.length < 50) {
    suggestions.push("Expand your character repertoire with new decks");
  }
  
  suggestions.push("Try speed recognition drills to improve reaction time");
  
  return suggestions;
}