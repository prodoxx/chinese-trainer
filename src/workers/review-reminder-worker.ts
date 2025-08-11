import { Worker } from 'bullmq';
import { PrismaClient } from '@/generated/prisma';
import connectDB from '@/lib/db/mongodb';
import Deck from '@/lib/db/models/Deck';
import Review from '@/lib/db/models/Review';
import { sendReviewReminder, DueCardsData } from '@/lib/email/reminder-service';
import getRedis from '@/lib/queue/redis';
import { startOfDay, endOfDay } from 'date-fns';
// Removed unused imports: parseISO, format, toZonedTime

const prisma = new PrismaClient();

interface ReminderJobData {
  userId: string;
  type: 'daily' | 'weekly' | 'manual';
}

export async function getDueCardsForUser(userId: string): Promise<DueCardsData> {
  await connectDB();
  
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  
  // Get all user's decks
  const userDecks = await Deck.find({ userId }).lean();
  
  if (userDecks.length === 0) {
    return {
      totalCards: 0,
      byDeck: [],
      overdueCards: 0,
      todayCards: 0,
    };
  }
  
  const deckIds = userDecks.map(d => (d._id as any).toString());
  
  // Get all reviews for this user's decks
  const reviews = await Review.find({
    deckId: { $in: deckIds },
    nextReviewDate: { $lte: todayEnd }
  }).lean();
  
  // Count overdue and today's cards
  let overdueCards = 0;
  let todayCards = 0;
  const cardsByDeck = new Map<string, number>();
  
  reviews.forEach(review => {
    const nextReview = new Date(review.nextReviewDate);
    if (nextReview < todayStart) {
      overdueCards++;
    } else {
      todayCards++;
    }
    
    const deckId = review.deckId.toString();
    cardsByDeck.set(deckId, (cardsByDeck.get(deckId) || 0) + 1);
  });
  
  // Build deck breakdown
  const byDeck = userDecks
    .map(deck => ({
      deckName: deck.name,
      deckId: (deck._id as any).toString(),
      cardCount: cardsByDeck.get((deck._id as any).toString()) || 0
    }))
    .filter(d => d.cardCount > 0)
    .sort((a, b) => b.cardCount - a.cardCount);
  
  return {
    totalCards: reviews.length,
    byDeck,
    overdueCards,
    todayCards,
  };
}

// Worker to process reminder jobs
const reminderWorker = new Worker(
  'review-reminders',
  async (job) => {
    const { userId, type } = job.data as ReminderJobData;
    
    console.log(`Processing ${type} reminder for user ${userId}`);
    
    try {
      // Get user details from Prisma
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { reminderPreferences: true }
      });
      
      if (!user || !user.email) {
        throw new Error('User not found or no email');
      }
      
      // Check if reminders are enabled
      const prefs = user.reminderPreferences;
      if (!prefs?.enabled) {
        console.log(`Reminders disabled for user ${userId}`);
        return { status: 'skipped', reason: 'disabled' };
      }
      
      // Check if we've already sent a reminder today
      if (type === 'daily' && prefs.lastDailyReminder) {
        const lastSent = new Date(prefs.lastDailyReminder);
        const today = startOfDay(new Date());
        if (lastSent >= today) {
          console.log(`Already sent daily reminder to user ${userId} today`);
          return { status: 'skipped', reason: 'already_sent' };
        }
      }
      
      // Get due cards data
      const dueCardsData = await getDueCardsForUser(userId);
      
      // Check minimum threshold
      if (dueCardsData.totalCards < (prefs.minCardsThreshold || 5)) {
        console.log(`Not enough cards due for user ${userId}: ${dueCardsData.totalCards}`);
        return { status: 'skipped', reason: 'below_threshold' };
      }
      
      // Send the reminder
      const result = await sendReviewReminder(
        userId,
        user.email,
        user.name || 'Student',
        dueCardsData
      );
      
      if (result.success) {
        // Update last sent timestamp
        await prisma.userReminderPreferences.update({
          where: { userId },
          data: { lastDailyReminder: new Date() }
        });
        
        console.log(`Successfully sent reminder to user ${userId}`);
        return { status: 'sent', emailId: result.emailId };
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error(`Error processing reminder for user ${userId}:`, error);
      throw error;
    }
  },
  {
    connection: getRedis(),
    concurrency: 5,
  }
);

// Error handling
reminderWorker.on('failed', (job, err) => {
  console.error(`Reminder job ${job?.id} failed:`, err);
});

reminderWorker.on('completed', (job) => {
  console.log(`Reminder job ${job.id} completed`);
});

export default reminderWorker;