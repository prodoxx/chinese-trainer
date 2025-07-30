import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Deck from '@/lib/db/models/Deck';

export async function GET() {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // Only return decks for the current user
    const decks = await Deck.find({ userId: session.user.id }).sort({ updatedAt: -1 });
    
    return NextResponse.json({
      decks: decks.map(deck => ({
        id: deck._id,
        name: deck.name,
        slug: deck.slug,
        cardsCount: deck.cardsCount,
        status: deck.status || 'ready',
        enrichmentProgress: deck.enrichmentProgress,
        updatedAt: deck.updatedAt,
      }))
    });
    
  } catch (error) {
    console.error('Get decks error:', error);
    return NextResponse.json({ error: 'Failed to get decks' }, { status: 500 });
  }
}