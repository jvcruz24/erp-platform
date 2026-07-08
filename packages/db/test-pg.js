import { prisma } from './dist/src/index.js';

try {
  const result = await prisma.user.findFirst();
  console.log('QUERY OK:', result);
} catch (err) {
  console.error('QUERY FAILED:', err);
} finally {
  await prisma.$disconnect();
}
