import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  const email = 'kingdomlibrarysystem@gmail.com';
  const newPassword = 'Test@12345';
  const saltRounds = 10;

  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Find the admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        role: {
          name: {
            in: ['admin', 'administrator'],
          },
        },
      },
      include: { role: true },
    });

    if (!adminUser) {
      console.log('No admin user found. Creating new admin user...');

      // Find or create admin role
      let adminRole = await prisma.role.findFirst({
        where: { name: 'admin' },
      });

      if (!adminRole) {
        adminRole = await prisma.role.create({
          data: { name: 'admin' },
        });
        console.log('Created admin role:', adminRole.id);
      }

      // Create new admin user
      const newAdmin = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Admin',
          roleId: adminRole.id,
          status: 'ACTIVE',
          emailVerified: new Date(),
        },
      });

      console.log('Created new admin user:', newAdmin.email);
      console.log('Password has been set to:', newPassword);
      return;
    }

    // Update existing admin user's password
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { password: hashedPassword },
    });

    console.log(`Updated password for admin user: ${adminUser.email}`);
    console.log('New password:', newPassword);
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
