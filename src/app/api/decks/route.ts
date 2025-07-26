import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Deck from '@/lib/db/models/Deck';

export async function GET() {
  try {
    await connectDB();
    
    const decks = await Deck.find({}).sort({ updatedAt: -1 });
    
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