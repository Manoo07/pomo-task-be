import { PrismaClient } from '@prisma/client';

// Create a test Prisma client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env['TEST_DATABASE_URL'] ||
        'postgresql://test:test@localhost:5432/pomofocus_test_db',
    },
  },
});

// Global test setup
beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();

  // Clean up test data
  await prisma.dailyAnalytics.deleteMany();
  await prisma.session.deleteMany();
  await prisma.task.deleteMany();
  await prisma.learningTrack.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();
});

// Global test teardown
afterAll(async () => {
  // Clean up test data
  await prisma.dailyAnalytics.deleteMany();
  await prisma.session.deleteMany();
  await prisma.task.deleteMany();
  await prisma.learningTrack.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();

  // Disconnect from database
  await prisma.$disconnect();
});

// Clean up after each test
afterEach(async () => {
  // Clean up test data after each test
  await prisma.dailyAnalytics.deleteMany();
  await prisma.session.deleteMany();
  await prisma.task.deleteMany();
  await prisma.learningTrack.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();
});

export { prisma };
