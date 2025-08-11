import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET current preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await prisma.userReminderPreferences.findUnique({
      where: { userId: session.user.id },
    });

    // Return default preferences if none exist
    if (!preferences) {
      return NextResponse.json({
        enabled: true,
        reminderTime: '09:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        minCardsThreshold: 5,
        dailyReminders: true,
        weeklyDigest: false,
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching reminder preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// PUT update preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const {
      enabled,
      reminderTime,
      timezone,
      minCardsThreshold,
      dailyReminders,
      weeklyDigest,
    } = body;

    // Validate time format (HH:MM)
    if (reminderTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(reminderTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM' },
        { status: 400 }
      );
    }

    // Upsert preferences
    const preferences = await prisma.userReminderPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        enabled: enabled ?? undefined,
        reminderTime: reminderTime ?? undefined,
        timezone: timezone ?? undefined,
        minCardsThreshold: minCardsThreshold ?? undefined,
        dailyReminders: dailyReminders ?? undefined,
        weeklyDigest: weeklyDigest ?? undefined,
      },
      create: {
        userId: session.user.id,
        enabled: enabled ?? true,
        reminderTime: reminderTime ?? '09:00',
        timezone: timezone ?? 'UTC',
        minCardsThreshold: minCardsThreshold ?? 5,
        dailyReminders: dailyReminders ?? true,
        weeklyDigest: weeklyDigest ?? false,
      },
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error updating reminder preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

// DELETE disable reminders
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.userReminderPreferences.update({
      where: { userId: session.user.id },
      data: { enabled: false },
    });

    return NextResponse.json({ message: 'Reminders disabled' });
  } catch (error) {
    console.error('Error disabling reminders:', error);
    return NextResponse.json(
      { error: 'Failed to disable reminders' },
      { status: 500 }
    );
  }
}