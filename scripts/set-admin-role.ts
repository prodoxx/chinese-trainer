import { prisma } from '@/lib/db'

async function setAdminRole() {
  try {
    const user = await prisma.user.update({
      where: {
        email: 'reggie.escobar94@gmail.com'
      },
      data: {
        role: 'admin'
      }
    })
    
    console.log(`✅ Successfully updated user role to admin for ${user.email}`)
    console.log('User details:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    })
  } catch (error) {
    console.error('❌ Error updating user role:', error)
    if ((error as any).code === 'P2025') {
      console.error('User with email reggie.escobar94@gmail.com not found')
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
setAdminRole()