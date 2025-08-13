import { prisma } from '@/lib/db'

async function listAdmins() {
  try {
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        emailVerified: true
      },
      orderBy: { createdAt: 'asc' }
    })
    
    if (admins.length === 0) {
      console.log('ℹ️ No admin users found')
    } else {
      console.log(`\n📋 Admin Users (${admins.length} total):\n`)
      console.log('─'.repeat(80))
      
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email}`)
        console.log(`   Name: ${admin.name || 'Not set'}`)
        console.log(`   ID: ${admin.id}`)
        console.log(`   Created: ${admin.createdAt.toLocaleDateString()}`)
        console.log(`   Email Verified: ${admin.emailVerified ? 'Yes' : 'No'}`)
        if (index < admins.length - 1) {
          console.log('─'.repeat(80))
        }
      })
    }
    
    // Also show total user count
    const totalUsers = await prisma.user.count()
    const regularUsers = totalUsers - admins.length
    
    console.log('\n' + '═'.repeat(80))
    console.log(`📊 User Statistics:`)
    console.log(`   Total Users: ${totalUsers}`)
    console.log(`   Admin Users: ${admins.length}`)
    console.log(`   Regular Users: ${regularUsers}`)
    
  } catch (error) {
    console.error('❌ Error fetching admin users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
listAdmins()