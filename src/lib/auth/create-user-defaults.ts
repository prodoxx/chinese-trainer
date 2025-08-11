import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * Create default preferences for a new user
 * Called after user registration or first sign-in
 */
export async function createUserDefaults(userId: string) {
  try {
    // Create reminder preferences with defaults
    await prisma.userReminderPreferences.upsert({
      where: { userId },
      update: {}, // Don't update if exists
      create: {
        userId,
        enabled: true,
        reminderTime: '09:00',
        timezone: 'Asia/Taipei', // Default to Taiwan time
        minCardsThreshold: 5,
        dailyReminders: true,
        weeklyDigest: false,
      }
    });

    // Create user settings if they don't exist
    await prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        reduceMotion: false,
        brightness: 1.0,
        audioEnabled: true,
        autoplayAudio: true,
        fontSize: 'medium',
        theme: 'dark',
        emailNotifications: true,
        reviewReminders: true,
        showFlashDemo: true,
      }
    });

    // Create user profile if it doesn't exist
    await prisma.userProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        preferredLanguage: 'en',
        dailyGoal: 10,
      }
    });

    console.log(`Created default preferences for user ${userId}`);
  } catch (error) {
    console.error('Error creating user defaults:', error);
    // Don't throw - these are nice-to-haves
  }
}