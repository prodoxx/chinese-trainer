import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Card from '@/lib/db/models/Card';
import { analyzeCharacterComprehensively } from '@/lib/analytics/openai-linguistic-analysis';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find the card
    const { cardId } = await params;
    const card = await Card.findById(cardId);
    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    console.log(`🔄 Regenerating AI insights for card: ${card.hanzi} (${card._id})`);

    try {
      // Generate comprehensive AI analysis
      const aiAnalysis = await analyzeCharacterComprehensively(
        card.hanzi,
        card.pinyin,
        card.meaning || card.english?.join(', ') || ''
      );

      // Update card with new AI insights (preserve all media)
      card.semanticCategory = aiAnalysis.semanticCategory;
      card.semanticFields = aiAnalysis.semanticFields;
      card.conceptType = aiAnalysis.conceptType;
      card.radicals = aiAnalysis.radicals;
      card.tonePattern = aiAnalysis.tonePattern;
      card.toneDescription = aiAnalysis.toneDescription;
      card.strokeCount = aiAnalysis.strokeCount;
      card.componentCount = aiAnalysis.componentCount;
      card.visualComplexity = aiAnalysis.visualComplexity;
      card.etymology = aiAnalysis.etymology;
      card.mnemonics = aiAnalysis.mnemonics;
      card.commonConfusions = aiAnalysis.commonConfusions;
      card.contextExamples = aiAnalysis.contextExamples;
      card.collocations = aiAnalysis.collocations;
      
      // Store the prompt used for debugging
      card.comprehensiveAnalysisPrompt = aiAnalysis.comprehensiveAnalysisPrompt;
      
      // Mark as enriched with OpenAI
      card.openAIModel = 'gpt-4o-mini';
      card.analysisVersion = '2.0';
      
      // Save the updated card
      await card.save();

      console.log(`✅ AI insights regenerated successfully for: ${card.hanzi}`);

      return NextResponse.json({
        success: true,
        message: 'AI insights regenerated successfully',
        card: {
          _id: card._id,
          hanzi: card.hanzi,
          pinyin: card.pinyin,
          meaning: card.meaning,
          semanticCategory: card.semanticCategory,
          commonConfusions: card.commonConfusions,
          etymology: card.etymology,
          mnemonics: card.mnemonics,
        }
      });

    } catch (aiError) {
      console.error('AI analysis error:', aiError);
      return NextResponse.json(
        { 
          error: 'Failed to generate AI insights',
          details: aiError instanceof Error ? aiError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Regenerate AI insights error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}