import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Review from '@/lib/db/models/Review';
import Card from '@/lib/db/models/Card';
import Deck from '@/lib/db/models/Deck';
import DeckCard from '@/lib/db/models/DeckCard';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get date range from query params (default to last 30 days)
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get all reviews (including those without lastReviewedAt)
    const reviews = await Review.find({
      $or: [
        { lastReviewedAt: { $gte: startDate } },
        { firstStudiedAt: { $gte: startDate } }
      ]
    }).populate('cardId');
    
    // Calculate daily stats
    const dailyStats = new Map<string, {
      date: string;
      cardsStudied: number;
      correctAnswers: number;
      totalAnswers: number;
      studyTimeMs: number;
    }>();
    
    // Process reviews to build daily stats
    reviews.forEach(review => {
      // Use firstStudiedAt and lastReviewedAt to track activity
      const dates = [];
      if (review.firstStudiedAt) {
        dates.push(new Date(review.firstStudiedAt).toISOString().split('T')[0]);
      }
      if (review.lastReviewedAt && review.lastReviewedAt !== review.firstStudiedAt) {
        dates.push(new Date(review.lastReviewedAt).toISOString().split('T')[0]);
      }
      
      dates.forEach(date => {
        if (!dailyStats.has(date)) {
          dailyStats.set(date, {
            date,
            cardsStudied: 0,
            correctAnswers: 0,
            totalAnswers: 0,
            studyTimeMs: 0,
          });
        }
        
        const stats = dailyStats.get(date)!;
        stats.cardsStudied++;
        stats.totalAnswers += review.seen || 0;
        stats.correctAnswers += review.correct || 0;
        stats.studyTimeMs += (review.avgResponseMs || 0) * (review.seen || 1);
      });
    });
    
    // Convert to array and sort by date
    const dailyStatsArray = Array.from(dailyStats.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    );
    
    // Calculate overall stats
    const totalCards = await Card.countDocuments();
    const totalReviews = reviews.reduce((sum, r) => sum + (r.seen || 0), 0);
    const correctReviews = reviews.reduce((sum, r) => sum + (r.correct || 0), 0);
    
    // Calculate study streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    // Generate all dates in range
    const allDates = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      allDates.push(date.toISOString().split('T')[0]);
    }
    
    // Check streak from most recent to oldest
    for (const date of allDates) {
      if (dailyStats.has(date)) {
        tempStreak++;
        if (date === today || allDates[allDates.indexOf(date) - 1] === today) {
          currentStreak = tempStreak;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
        if (currentStreak === 0 && date < today) {
          break; // No current streak if we missed a day before today
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    
    // Get deck performance
    const decks = await Deck.find();
    const deckStats = await Promise.all(decks.map(async (deck) => {
      const deckCards = await DeckCard.find({ deckId: deck._id }).populate('cardId');
      const cardIds = deckCards.map(dc => dc.cardId._id);
      
      const deckReviews = await Review.find({ cardId: { $in: cardIds } });
      const totalDeckReviews = deckReviews.reduce((sum, r) => sum + (r.seen || 0), 0);
      const correctDeckReviews = deckReviews.reduce((sum, r) => sum + (r.correct || 0), 0);
      
      return {
        deckId: deck._id,
        deckName: deck.name,
        totalCards: deckCards.length,
        studiedCards: deckReviews.filter(r => r.seen > 0).length,
        totalReviews: totalDeckReviews,
        correctReviews: correctDeckReviews,
        accuracy: totalDeckReviews > 0 ? (correctDeckReviews / totalDeckReviews) * 100 : 0,
      };
    }));
    
    // Calculate learning curve (accuracy over time)
    const learningCurve = dailyStatsArray.map(day => ({
      date: day.date,
      accuracy: day.totalAnswers > 0 ? (day.correctAnswers / day.totalAnswers) * 100 : 0,
      cardsStudied: day.cardsStudied,
    }));
    
    // Calculate retention rates by interval
    const retentionByInterval = new Map<number, { total: number; correct: number }>();
    
    // Group reviews by interval days
    reviews.forEach(review => {
      if (review.intervalDays && review.intervalDays > 0) {
        const interval = Math.min(review.intervalDays, 30); // Cap at 30 days
        
        if (!retentionByInterval.has(interval)) {
          retentionByInterval.set(interval, { total: 0, correct: 0 });
        }
        
        const stats = retentionByInterval.get(interval)!;
        stats.total += review.seen || 0;
        stats.correct += review.correct || 0;
      }
    });
    
    // Convert retention data to array
    const retentionData = Array.from(retentionByInterval.entries())
      .filter(([days]) => days > 0 && days <= 30) // Only show first 30 days
      .map(([days, stats]) => ({
        interval: days,
        retention: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        sampleSize: stats.total,
      }))
      .sort((a, b) => a.interval - b.interval);
    
    return NextResponse.json({
      success: true,
      analytics: {
        summary: {
          totalCards,
          totalReviews,
          accuracy: totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0,
          currentStreak,
          longestStreak,
          studiedToday: dailyStats.has(today) ? dailyStats.get(today)!.cardsStudied : 0,
        },
        dailyStats: dailyStatsArray,
        deckStats,
        learningCurve,
        retentionData,
      },
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}