import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Review from '@/lib/db/models/Review';
import StudySession from '@/lib/db/models/StudySession';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { userId } = await context.params;
    
    // Get all reviews for this user
    const reviews = await Review.find({ userId });
    
    // Calculate performance stats
    let totalReviews = 0;
    let totalCorrect = 0;
    let totalResponseTime = 0;
    let cardsLearned = 0;
    let cardsMastered = 0;
    
    reviews.forEach(review => {
      if (review.seen > 0) {
        totalReviews += review.seen;
        totalCorrect += review.correct || 0;
        totalResponseTime += (review.avgResponseMs || 0) * review.seen;
        
        // Card is learned if seen at least once
        cardsLearned++;
        
        // Card is mastered if accuracy > 90% and seen at least 5 times
        if (review.seen >= 5 && review.correct / review.seen >= 0.9) {
          cardsMastered++;
        }
      }
    });
    
    const averageAccuracy = totalReviews > 0 ? (totalCorrect / totalReviews) * 100 : 0;
    const averageResponseTime = totalReviews > 0 ? totalResponseTime / totalReviews : 0;
    
    // Get study sessions to calculate total study time
    const sessions = await StudySession.find({ 
      userId,
      endTime: { $exists: true }
    });
    
    let totalStudyTime = 0;
    let studyStreak = 0;
    
    // Calculate total study time
    sessions.forEach(session => {
      if (session.durationMs) {
        totalStudyTime += session.durationMs;
      } else if (session.startTime && session.endTime) {
        const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
        totalStudyTime += duration;
      }
    });
    
    // Calculate study streak (consecutive days)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let currentDate = new Date(today);
    let hasStudiedToday = false;
    
    // Check if studied today
    const todaySession = await StudySession.findOne({
      userId,
      startTime: { 
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    if (todaySession) {
      hasStudiedToday = true;
      studyStreak = 1;
    }
    
    // Count backward from yesterday to find streak
    if (!hasStudiedToday) {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    let streakContinues = true;
    let maxDaysToCheck = 365; // Prevent infinite loop
    while (streakContinues && maxDaysToCheck > 0) {
      currentDate.setDate(currentDate.getDate() - 1);
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      
      const sessionOnDay = await StudySession.findOne({
        userId,
        startTime: { $gte: dayStart, $lt: dayEnd }
      });
      
      if (sessionOnDay) {
        studyStreak++;
      } else {
        streakContinues = false;
      }
      maxDaysToCheck--;
    }
    
    return NextResponse.json({
      success: true,
      performance: {
        totalReviews,
        averageAccuracy,
        averageResponseTime,
        studyStreak,
        totalStudyTime,
        cardsLearned,
        cardsMastered
      }
    });
    
  } catch (error) {
    console.error('Admin user performance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user performance' },
      { status: 500 }
    );
  }
}