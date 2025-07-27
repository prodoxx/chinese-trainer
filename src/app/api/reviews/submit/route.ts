import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Review from '@/lib/db/models/Review';
import { calculateNextReview, calculateQuality, calculateMemoryStrength } from '@/lib/spaced-repetition/sm2';
import mongoose from 'mongoose';

export interface ReviewSubmission {
  cardId: string;
  deckId: string;
  correct: boolean;
  responseTimeMs: number;
  timedOut?: boolean;
}

export async function POST(req: NextRequest) {
  let submissions: ReviewSubmission[] = [];
  
  try {
    await connectDB();
    
    submissions = await req.json();
    
    if (!Array.isArray(submissions)) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    
    const results = [];
    
    for (const submission of submissions) {
      const { cardId, deckId, correct, responseTimeMs, timedOut } = submission;
      
      // Validate ObjectIds
      if (!mongoose.Types.ObjectId.isValid(cardId) || !mongoose.Types.ObjectId.isValid(deckId)) {
        console.error('Invalid ObjectId:', { cardId, deckId });
        continue;
      }
      
      // Find or create review record
      let review = await Review.findOne({ cardId });
      
      if (!review) {
        review = new Review({
          cardId: new mongoose.Types.ObjectId(cardId),
          deckId: new mongoose.Types.ObjectId(deckId),
          ease: 2.5,
          intervalDays: 1,
          repetitions: 0,
          due: new Date(),
          seen: 0,
          correct: 0,
          firstStudiedAt: new Date(), // Mark as studied when first reviewed
          avgResponseMs: 0,
        });
      } else {
        // Ensure deckId is set for existing reviews (migration case)
        if (!review.deckId) {
          review.deckId = new mongoose.Types.ObjectId(deckId);
        }
      }
      
      // Update basic stats
      review.seen += 1;
      if (correct) review.correct += 1;
      
      // Set firstStudiedAt if this is the first time
      if (!review.firstStudiedAt) {
        review.firstStudiedAt = new Date();
      }
      
      // Update average response time
      review.avgResponseMs = Math.round(
        (review.avgResponseMs * (review.seen - 1) + responseTimeMs) / review.seen
      );
      
      // Calculate quality score
      const quality = calculateQuality(correct, responseTimeMs, timedOut);
      
      // Apply SM-2 algorithm
      const currentState = {
        ease: review.ease,
        intervalDays: review.intervalDays,
        repetitions: review.repetitions,
        due: review.due,
        lastReviewedAt: review.lastReviewedAt || new Date(),
      };
      
      const nextState = calculateNextReview(currentState, { quality, responseTimeMs });
      
      // Update review with new state
      review.ease = nextState.ease;
      review.intervalDays = nextState.intervalDays;
      review.repetitions = nextState.repetitions;
      review.due = nextState.due;
      review.lastReviewedAt = nextState.lastReviewedAt;
      
      // Calculate and cache memory strength
      review.memoryStrength = calculateMemoryStrength(nextState);
      
      await review.save();
      
      results.push({
        cardId,
        quality,
        nextReview: nextState.due,
        intervalDays: nextState.intervalDays,
        memoryStrength: review.memoryStrength,
      });
    }
    
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Review submission error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to submit reviews',
        details: errorMessage,
        submissions: submissions.map(s => ({ cardId: s.cardId, deckId: s.deckId }))
      },
      { status: 500 }
    );
  }
}