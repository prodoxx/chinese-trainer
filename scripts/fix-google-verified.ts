#!/usr/bin/env bun
// Fix emailVerified for existing Google OAuth users

import { prisma } from '@/lib/db'

async function fixGoogleVerifiedUsers() {
  try {
    console.log('Fixing emailVerified for Google OAuth users...')
    
    // Find users with Google accounts who aren't verified
    const googleUsers = await prisma.user.findMany({
      where: {
        emailVerified: null,
        accounts: {
          some: {
            provider: 'google'
          }
        }
      },
      include: {
        accounts: {
          where: {
            provider: 'google'
          }
        }
      }
    })
    
    console.log(`Found ${googleUsers.length} Google users without emailVerified`)
    
    // Update each user
    for (const user of googleUsers) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      })
      console.log(`✓ Updated ${user.email}`)
    }
    
    console.log('\nDone! All Google OAuth users now have emailVerified set.')
    
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixGoogleVerifiedUsers()