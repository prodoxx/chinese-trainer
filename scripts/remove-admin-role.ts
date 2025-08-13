import { prisma } from '@/lib/db'

async function removeAdminRole(email?: string) {
  // Get email from command line argument
  const targetEmail = email || process.argv[2];
  
  if (!targetEmail) {
    console.error('❌ Please provide an email address as an argument')
    console.log('Usage: bun run scripts/remove-admin-role.ts <email>')
    console.log('Example: bun run scripts/remove-admin-role.ts user@example.com')
    process.exit(1)
  }
  
  try {
    // First check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: targetEmail }
    })
    
    if (!existingUser) {
      console.error(`❌ User with email ${targetEmail} not found`)
      console.log('\nExisting users:')
      const users = await prisma.user.findMany({
        select: { email: true, name: true, role: true }
      })
      users.forEach(u => {
        console.log(`  - ${u.email} (${u.name || 'No name'}) - Role: ${u.role}`)
      })
      process.exit(1)
    }
    
    // Check if not admin
    if (existingUser.role !== 'admin') {
      console.log(`ℹ️ User ${targetEmail} is not an admin (current role: ${existingUser.role})`)
      process.exit(0)
    }
    
    // Update user role to regular user
    const user = await prisma.user.update({
      where: {
        email: targetEmail
      },
      data: {
        role: 'user'
      }
    })
    
    console.log(`✅ Successfully removed admin role from ${user.email}`)
    console.log('User details:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      previousRole: existingUser.role
    })
  } catch (error) {
    console.error('❌ Error updating user role:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script with command line argument
removeAdminRole()