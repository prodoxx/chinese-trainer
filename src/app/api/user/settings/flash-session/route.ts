import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      // Return defaults for unauthenticated users
      return NextResponse.json({
        showFlashDemo: true,
        reduceMotion: false,
        brightness: 1.0
      })
    }

    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
      select: {
        showFlashDemo: true,
        reduceMotion: true,
        brightness: true
      }
    })
    
    // Return settings or defaults
    return NextResponse.json({
      showFlashDemo: userSettings?.showFlashDemo ?? true,
      reduceMotion: userSettings?.reduceMotion ?? false,
      brightness: userSettings?.brightness ?? 1.0
    })
  } catch (error) {
    console.error('Error fetching flash session settings:', error)
    // Return defaults on error
    return NextResponse.json({
      showFlashDemo: true,
      reduceMotion: false,
      brightness: 1.0
    })
  }
}