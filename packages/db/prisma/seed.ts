import { prisma } from '../src/client.js';

async function main() {
  console.log('🌱 Seeding database...');

  // Create a test user matching your Better Auth schema
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: 'user_test_123',
      name: 'Test Automation Dev',
      email: 'test@example.com',
      emailVerified: true,
      image: 'https://avatar.iran.liara.run/public', // placeholder image
    },
  });

  console.log('✅ User successfully verified/created in DB:', user);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
