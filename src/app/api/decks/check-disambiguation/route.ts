import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Dictionary from '@/lib/db/models/Dictionary';
import { convertPinyinToneNumbersToMarks } from '@/lib/utils/pinyin';
import { cleanDefinition } from '@/lib/utils/clean-definition';

interface MultiMeaningCharacter {
  hanzi: string;
  position: number;
  meanings: Array<{
    pinyin: string;
    meaning: string;
    frequency?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { hanziList } = await request.json();
    
    if (!hanziList || !Array.isArray(hanziList)) {
      return NextResponse.json(
        { error: 'Invalid hanzi list' }, 
        { status: 400 }
      );
    }

    await connectDB();
    
    // Check each character for multiple meanings
    const charactersNeedingClarification: MultiMeaningCharacter[] = [];
    
    for (let i = 0; i < hanziList.length; i++) {
      const hanzi = hanziList[i];
      
      // Find all dictionary entries for this character
      const entries = await Dictionary.find({ 
        traditional: hanzi 
      });
      
      if (entries.length > 1) {
        // Character has multiple pronunciations/meanings
        charactersNeedingClarification.push({
          hanzi,
          position: i + 1,
          meanings: entries.map(entry => ({
            pinyin: convertPinyinToneNumbersToMarks(entry.pinyin),
            meaning: cleanDefinition(entry.definitions[0] || 'No definition'),
            // Add frequency hint based on common usage
            frequency: getFrequencyHint(hanzi, entry.pinyin)
          }))
        });
      }
    }
    
    return NextResponse.json({
      needsDisambiguation: charactersNeedingClarification.length > 0,
      charactersNeedingClarification,
      totalCharacters: hanziList.length,
      ambiguousCount: charactersNeedingClarification.length
    });
    
  } catch (error) {
    console.error('Disambiguation check error:', error);
    return NextResponse.json(
      { error: 'Failed to check for disambiguation' }, 
      { status: 500 }
    );
  }
}

function getFrequencyHint(hanzi: string, pinyin: string): string {
  // Common characters with known frequency patterns
  const commonPatterns: Record<string, Record<string, string>> = {
    '累': {
      'lei4': 'very common',
      'lei3': 'common'
    },
    '行': {
      'xing2': 'very common',
      'hang2': 'common'
    },
    '长': {
      'zhang3': 'common',
      'chang2': 'very common'
    },
    '得': {
      'de2': 'very common',
      'dei3': 'less common',
      'de5': 'very common'
    }
  };
  
  return commonPatterns[hanzi]?.[pinyin.toLowerCase()] || 'common';
}