#!/usr/bin/env bun

/**
 * Script to add reminder preferences to existing users
 * Run this once after deploying the reminder system
 */

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🔔 Adding reminder preferences to existing users...\n');

  try {
    // Get all users without reminder preferences
    const users = await prisma.user.findMany({
      where: {
        reminderPreferences: null
      },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    console.log(`Found ${users.length} users without reminder preferences`);

    if (users.length === 0) {
      console.log('✅ All users already have reminder preferences!');
      return;
    }

    let created = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await prisma.userReminderPreferences.create({
          data: {
            userId: user.id,
            enabled: true,
            reminderTime: '09:00',
            timezone: 'Asia/Taipei', // Default to Taiwan time
            minCardsThreshold: 5,
            dailyReminders: true,
            weeklyDigest: false,
          }
        });
        
        console.log(`✅ Created preferences for ${user.name || user.email || user.id}`);
        created++;
      } catch (error) {
        console.error(`❌ Failed for user ${user.id}:`, error);
        failed++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  Created: ${created}`);
    console.log(`  Failed: ${failed}`);
    console.log('\n✅ Done!');

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();