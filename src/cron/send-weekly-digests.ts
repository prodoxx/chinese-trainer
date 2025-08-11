#!/usr/bin/env node

/**
 * Cron job script to send weekly digest emails
 * This is executed by Railway's cron job service
 * 
 * Schedule: Run every Monday at 10 AM UTC
 * Railway cron expression: 0 10 * * 1
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { PrismaClient } from '@/generated/prisma';
import { Queue } from 'bullmq';
import getRedis from '@/lib/queue/redis';

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

async function sendWeeklyDigests() {
  const startTime = Date.now();
  
  console.log(`[${new Date().toISOString()}] Starting weekly digest distribution`);
  
  try {
    const usersWithPrefs = await prisma.userReminderPreferences.findMany({
      where: {
        enabled: true,
        weeklyDigest: true,
      },
    });
    
    console.log(`Found ${usersWithPrefs.length} users subscribed to weekly digest`);
    
    let scheduledCount = 0;
    let skippedCount = 0;
    
    for (const prefs of usersWithPrefs) {
      try {
        // Check if we haven't sent this week
        const lastSent = prefs.lastWeeklyDigest;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        if (!lastSent || lastSent < oneWeekAgo) {
          const job = await reminderQueue.add(
            'weekly-digest',
            {
              userId: prefs.userId,
              type: 'weekly',
            },
            {
              // Spread over 1 hour to avoid overloading
              delay: Math.random() * 60 * 60 * 1000,
            }
          );
          
          console.log(`Scheduled weekly digest for user ${prefs.userId} (job ${job.id})`);
          scheduledCount++;
        } else {
          console.log(`Skipped user ${prefs.userId} - already sent this week`);
          skippedCount++;
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
    console.error('Fatal error in sendWeeklyDigests:', error);
    
    // Close connections
    await prisma.$disconnect();
    await reminderQueue.close();
    
    // Exit with error code
    process.exit(1);
  }
}

// Run immediately when script is executed
sendWeeklyDigests();