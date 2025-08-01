import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        settings: true,
        profile: true
      }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return user settings
    const settings = {
      email: user.email || '',
      displayName: user.name || 'User',
      notifications: {
        emailReminders: user.settings?.emailNotifications ?? true,
        dailyGoalReminders: user.settings?.reviewReminders ?? true,
        achievementNotifications: true // Not in schema, default to true
      },
      preferences: {
        theme: user.settings?.theme || 'dark',
        language: user.profile?.preferredLanguage || 'en',
        defaultDifficulty: 'medium', // Not in schema, default to medium
        autoPlayAudio: user.settings?.autoplayAudio ?? true,
        showPinyin: true, // Not in schema, default to true
        fontSize: user.settings?.fontSize || 'medium'
      },
      studyGoals: {
        dailyCards: user.profile?.dailyGoal || 20,
        weeklyDays: 5 // Not in schema, default to 5
      },
      flashSession: {
        showDemo: user.settings?.showFlashDemo ?? true,
        reduceMotion: user.settings?.reduceMotion ?? false,
        brightness: user.settings?.brightness ?? 1.0
      }
    }

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, displayName, notifications, preferences, studyGoals, flashSession } = body

    // Update user info, settings, and profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user basic info
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          email: email || undefined,
          name: displayName || undefined,
        }
      })

      // Update or create user settings
      const updatedSettings = await tx.userSettings.upsert({
        where: { userId: session.user.id },
        update: {
          emailNotifications: notifications?.emailReminders,
          reviewReminders: notifications?.dailyGoalReminders,
          theme: preferences?.theme,
          autoplayAudio: preferences?.autoPlayAudio,
          fontSize: preferences?.fontSize,
          showFlashDemo: flashSession?.showDemo,
          reduceMotion: flashSession?.reduceMotion,
          brightness: flashSession?.brightness,
          updatedAt: new Date()
        },
        create: {
          userId: session.user.id,
          emailNotifications: notifications?.emailReminders ?? true,
          reviewReminders: notifications?.dailyGoalReminders ?? true,
          theme: preferences?.theme || 'dark',
          autoplayAudio: preferences?.autoPlayAudio ?? true,
          fontSize: preferences?.fontSize || 'medium',
          showFlashDemo: flashSession?.showDemo ?? true,
          reduceMotion: flashSession?.reduceMotion ?? false,
          brightness: flashSession?.brightness ?? 1.0
        }
      })

      // Update or create user profile
      const updatedProfile = await tx.userProfile.upsert({
        where: { userId: session.user.id },
        update: {
          preferredLanguage: preferences?.language || 'en',
          dailyGoal: studyGoals?.dailyCards || 20,
          updatedAt: new Date()
        },
        create: {
          userId: session.user.id,
          preferredLanguage: preferences?.language || 'en',
          dailyGoal: studyGoals?.dailyCards || 20
        }
      })

      return { user: updatedUser, settings: updatedSettings, profile: updatedProfile }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated successfully',
      settings: {
        email: result.user.email || '',
        displayName: result.user.name || 'User',
        notifications: {
          emailReminders: result.settings.emailNotifications,
          dailyGoalReminders: result.settings.reviewReminders,
          achievementNotifications: true
        },
        preferences: {
          theme: result.settings.theme,
          language: result.profile.preferredLanguage,
          defaultDifficulty: 'medium',
          autoPlayAudio: result.settings.autoplayAudio,
          showPinyin: true,
          fontSize: result.settings.fontSize
        },
        studyGoals: {
          dailyCards: result.profile.dailyGoal,
          weeklyDays: 5
        },
        flashSession: {
          showDemo: result.settings.showFlashDemo,
          reduceMotion: result.settings.reduceMotion,
          brightness: result.settings.brightness
        }
      }
    })
  } catch (error) {
    console.error('Error updating user settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}