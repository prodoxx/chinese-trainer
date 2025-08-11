import { Resend } from 'resend';
import { ReviewReminderEmail } from '@/emails/review-reminder';
import { PrismaClient } from '@/generated/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);
const prisma = new PrismaClient();

export interface DueCardsData {
  totalCards: number;
  byDeck: {
    deckName: string;
    deckId: string;
    cardCount: number;
  }[];
  overdueCards: number;
  todayCards: number;
}

export async function sendReviewReminder(
  userId: string,
  userEmail: string,
  userName: string,
  dueCardsData: DueCardsData
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Chinese Flashcards <noreply@your-domain.com>',
      to: userEmail,
      subject: `📚 ${dueCardsData.totalCards} cards ready for review`,
      react: ReviewReminderEmail({
        userName,
        totalCards: dueCardsData.totalCards,
        overdueCards: dueCardsData.overdueCards,
        todayCards: dueCardsData.todayCards,
        deckBreakdown: dueCardsData.byDeck,
        reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/decks`
      }),
    });

    if (error) {
      throw error;
    }

    // Log the reminder
    await prisma.reminderLog.create({
      data: {
        userId,
        type: 'daily',
        status: 'sent',
        dueCards: dueCardsData.totalCards,
      }
    });

    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Failed to send review reminder:', error);
    
    // Log the failure
    await prisma.reminderLog.create({
      data: {
        userId,
        type: 'daily',
        status: 'failed',
        dueCards: dueCardsData.totalCards,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    });

    return { success: false, error };
  }
}

export async function sendWeeklyDigest(
  userId: string,
  userEmail: string,
  userName: string,
  weekStats: {
    cardsReviewed: number;
    streakDays: number;
    accuracy: number;
    upcomingCards: number;
  }
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Chinese Flashcards <noreply@your-domain.com>',
      to: userEmail,
      subject: `📊 Your weekly Chinese learning summary`,
      react: `Weekly Summary for ${userName}`, // You'll need to create this template
    });

    if (error) {
      throw error;
    }

    await prisma.reminderLog.create({
      data: {
        userId,
        type: 'weekly',
        status: 'sent',
        dueCards: weekStats.upcomingCards,
      }
    });

    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Failed to send weekly digest:', error);
    return { success: false, error };
  }
}