import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Review from '@/lib/db/models/Review';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const { cardIds, deckId } = await req.json();
    
    if (!cardIds || !Array.isArray(cardIds) || !deckId) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
    
    const now = new Date();
    
    // Mark cards as studied by setting firstStudiedAt
    const bulkOps = cardIds.map(cardId => ({
      updateOne: {
        filter: { 
          cardId: new mongoose.Types.ObjectId(cardId),
          deckId: new mongoose.Types.ObjectId(deckId)
        },
        update: {
          $setOnInsert: {
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