import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Deck from '@/lib/db/models/Deck';
import Review from '@/lib/db/models/Review';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
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
    
    const { cardIds, deckId } = await req.json();
    
    if (!cardIds || !Array.isArray(cardIds) || !deckId) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
    
    // Verify user owns this deck
    const deck = await Deck.findOne({ _id: deckId, userId: session.user.id });
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    
    const now = new Date();
    
    // Mark cards as studied by setting firstStudiedAt for current user
    const bulkOps = cardIds.map(cardId => ({
      updateOne: {
        filter: { 
          userId: session.user.id,
          cardId: new mongoose.Types.ObjectId(cardId),
          deckId: new mongoose.Types.ObjectId(deckId)
        },
        update: {
          $setOnInsert: {
            userId: session.user.id,
            cardId: new mongoose.Types.ObjectId(cardId),
            deckId: new mongoose.Types.ObjectId(deckId),
            ease: 2.5,
            intervalDays: 1,
            repetitions: 0,
            due: now,
            seen: 0,
            correct: 0,
            avgResponseMs: 0,
          },
          $set: {
            firstStudiedAt: now,
          }
        },
        upsert: true,
      }
    }));
    
    const result = await Review.bulkWrite(bulkOps);
    
    console.log('Mark studied result:', {
      cardIds: cardIds.length,
      deckId,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount,
    });
    
    return NextResponse.json({ 
      success: true,
      studiedCount: cardIds.length,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount,
    });
  } catch (error) {
    console.error('Failed to mark cards as studied:', error);
    return NextResponse.json(
      { error: 'Failed to mark cards as studied' },
      { status: 500 }
    );
  }
}