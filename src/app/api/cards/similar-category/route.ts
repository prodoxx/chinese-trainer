import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Card, { ICard } from '@/lib/db/models/Card';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { semanticCategory, excludeIds = [], limit = 10 } = await request.json();
    
    if (!semanticCategory) {
      return NextResponse.json({ error: 'Semantic category required' }, { status: 400 });
    }

    let similarCards;
    
    if (semanticCategory === 'general') {
      // For 'general', return random enriched cards
      similarCards = await Card.find({
        _id: { $nin: excludeIds },
        // Only get cards that have been enriched (have pinyin)
        pinyin: { $exists: true, $ne: null }
      })
      .select('hanzi pinyin meaning english imageUrl audioUrl semanticCategory')
      .limit(limit * 3) // Get more to randomize
      .lean();
      
      // Shuffle and limit
      similarCards = similarCards
        .sort(() => Math.random() - 0.5)
        .slice(0, limit);
    } else {
      // Find cards with the same semantic category, excluding specified IDs
      similarCards = await Card.find({
        semanticCategory,
        _id: { $nin: excludeIds },
        // Only get cards that have been enriched (have pinyin)
        pinyin: { $exists: true, $ne: null }
      })
      .select('hanzi pinyin meaning english imageUrl audioUrl semanticCategory')
      .limit(limit)
      .lean();
    }

    // Map to the expected format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cards = similarCards.map((card: any) => ({
      id: card._id.toString(),
      hanzi: card.hanzi,
      pinyin: card.pinyin,
      meaning: card.meaning || (card.english ? card.english.join(', ') : ''),
      imageUrl: card.imageUrl,
      audioUrl: card.audioUrl
    }));

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Error fetching similar category cards:', error);
    return NextResponse.json({ error: 'Failed to fetch similar cards' }, { status: 500 });
  }
}