#!/usr/bin/env node

/**
 * Cron job script to send review reminders
 * This is executed by Railway's cron job service
 * 
 * Schedule: Run hourly at minute 0
 * Railway cron expression: 0 * * * *
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { PrismaClient } from '@/generated/prisma';
import { Queue } from 'bullmq';
import getRedis from '@/lib/queue/redis';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const prisma = new PrismaClient();

// Create queue for reminder jobs
const reminderQueue = new Queue('review-reminders', {
  connection: getRedis(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 100,
    },
    removeOnFail: {
      count: 50,
    },
  },
});

async function sendHourlyReminders() {
  const startTime = Date.now();
  const currentUtcHour = new Date().getUTCHours();
  
  console.log(`[${new Date().toISOString()}] Starting hourly reminder check for UTC hour ${currentUtcHour}`);
  
  try {
    // Find all users with reminders enabled
    const usersWithPrefs = await prisma.userReminderPreferences.findMany({
      where: {
        enabled: true,
        dailyReminders: true,
      },
      include: {
        user: true,
      }
    });
    
    console.log(`Found ${usersWithPrefs.length} users with reminders enabled`);
    
    let scheduledCount = 0;
    let skippedCount = 0;
    
    for (const prefs of usersWithPrefs) {
      try {
        // Parse the user's preferred time (e.g., "09:00")
        const [prefHour] = prefs.reminderTime.split(':').map(Number);
        
        // Convert user's preferred time to UTC
        const userTimeZone = prefs.timezone || 'UTC';
        const now = new Date();
        const userLocalTime = toZonedTime(now, userTimeZone);
        const userCurrentHour = userLocalTime.getHours();
        
        // Check if it's time to send the reminder
        if (userCurrentHour === prefHour) {
          // Check if we haven't already sent today
          const lastSent = prefs.lastDailyReminder;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (!lastSent || lastSent < today) {
            // Schedule the reminder job
            const job = await reminderQueue.add(
              'daily-reminder',
              {
                userId: prefs.userId,
                type: 'daily',
              },
              {
                // Add some randomness to spread out the load (0-10 minutes)
                delay: Math.random() * 10 * 60 * 1000,
              }
            );
            
            console.log(`Scheduled reminder for user ${prefs.userId} (job ${job.id}) - ${prefs.reminderTime} ${userTimeZone}`);
            scheduledCount++;
          } else {
            console.log(`Skipped user ${prefs.userId} - already sent today`);
            skippedCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing user ${prefs.userId}:`, error);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`Completed: ${scheduledCount} scheduled, ${skippedCount} skipped, took ${duration}ms`);
    
    // Close connections
    await prisma.$disconnect();
    await reminderQueue.close();
    
    // Exit successfully
    process.exit(0);
  } catch (error) {
    console.error('Fatal error in sendHourlyReminders:', error);
    
    // Close connections
    await prisma.$disconnect();
    await reminderQueue.close();
    
    // Exit with error code
    process.exit(1);
  }
}

// Run immediately when script is executed
sendHourlyReminders();