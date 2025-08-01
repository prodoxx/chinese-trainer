import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete all user-related data in a transaction
    // Prisma will handle cascading deletes based on the schema
    await prisma.$transaction(async (tx) => {
      // The User model has onDelete: Cascade for related models,
      // so deleting the user will automatically delete:
      // - Accounts
      // - Sessions
      // - UserProfile
      // - UserSettings
      
      // If there are other models not linked with cascade, delete them first
      // For example, if you have Deck, Card, Review models:
      // await tx.review.deleteMany({ where: { userId: session.user.id } })
      // await tx.deck.deleteMany({ where: { userId: session.user.id } })
      
      // Finally delete the user
      await tx.user.delete({
        where: { id: session.user.id }
      })
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Account and all associated data deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting user account:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}