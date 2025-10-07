import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test users with different settings
  const hashedPassword = await bcrypt.hash('password123', 12);

  const users = await Promise.all([
    // User 1: Default settings
    prisma.user.upsert({
      where: { email: 'test@pomofocus.com' },
      update: {},
      create: {
        email: 'test@pomofocus.com',
        username: 'testuser',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
      },
    }),
    // User 2: Power user with custom settings
    prisma.user.upsert({
      where: { email: 'power@pomofocus.com' },
      update: {},
      create: {
        email: 'power@pomofocus.com',
        username: 'poweruser',
        password: hashedPassword,
        firstName: 'Power',
        lastName: 'User',
      },
    }),
    // User 3: Minimalist user
    prisma.user.upsert({
      where: { email: 'minimal@pomofocus.com' },
      update: {},
      create: {
        email: 'minimal@pomofocus.com',
        username: 'minimalist',
        password: hashedPassword,
        firstName: 'Minimal',
        lastName: 'User',
      },
    }),
  ]);

  console.log(
    '✅ Created test users:',
    users.map(u => u.email)
  );

  // Create diverse user settings
  const settingsData = [
    {
      userId: users[0].id,
      pomodoroDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      soundEnabled: true,
      desktopNotifications: true,
      emailNotifications: false,
      theme: 'light',
      language: 'en',
    },
    {
      userId: users[1].id,
      pomodoroDuration: 50,
      shortBreakDuration: 10,
      longBreakDuration: 30,
      longBreakInterval: 3,
      autoStartBreaks: true,
      autoStartPomodoros: true,
      soundEnabled: true,
      desktopNotifications: true,
      emailNotifications: true,
      theme: 'dark',
      language: 'en',
    },
    {
      userId: users[2].id,
      pomodoroDuration: 20,
      shortBreakDuration: 3,
      longBreakDuration: 10,
      longBreakInterval: 5,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      soundEnabled: false,
      desktopNotifications: false,
      emailNotifications: false,
      theme: 'light',
      language: 'es',
    },
  ];

  const settings = await Promise.all(
    settingsData.map(setting =>
      prisma.userSettings.upsert({
        where: { userId: setting.userId },
        update: {},
        create: setting,
      })
    )
  );

  console.log('✅ Created user settings for all users');

  // Create learning tracks for the first user
  const tracks = await Promise.all([
    prisma.learningTrack.create({
      data: {
        name: 'Web Development',
        description: 'Frontend and backend development tasks',
        color: '#3B82F6',
        icon: '💻',
        userId: users[0].id,
      },
    }),
    prisma.learningTrack.create({
      data: {
        name: 'AI & Machine Learning',
        description: 'Artificial intelligence and ML projects',
        color: '#10B981',
        icon: '🤖',
        userId: users[0].id,
      },
    }),
    prisma.learningTrack.create({
      data: {
        name: 'Design',
        description: 'UI/UX design and creative work',
        color: '#F59E0B',
        icon: '🎨',
        userId: users[0].id,
      },
    }),
  ]);

  console.log(
    '✅ Created learning tracks:',
    tracks.map(t => t.name)
  );

  // Create sample tasks for the first user
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Build React component library',
        description: 'Create reusable components for the project',
        priority: 'HIGH',
        estimatedPomodoros: 8,
        userId: users[0].id,
        trackId: tracks[0].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Implement user authentication',
        description: 'Add JWT-based auth system',
        priority: 'URGENT',
        estimatedPomodoros: 6,
        userId: users[0].id,
        trackId: tracks[0].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Train ML model for recommendation',
        description: 'Build recommendation engine using TensorFlow',
        priority: 'MEDIUM',
        estimatedPomodoros: 12,
        userId: users[0].id,
        trackId: tracks[1].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Design mobile app mockups',
        description: 'Create wireframes and high-fidelity designs',
        priority: 'MEDIUM',
        estimatedPomodoros: 10,
        userId: users[0].id,
        trackId: tracks[2].id,
      },
    }),
  ]);

  console.log(
    '✅ Created sample tasks:',
    tasks.map(t => t.title)
  );

  // Create sample sessions for the first user
  const sessions = await Promise.all([
    prisma.session.create({
      data: {
        type: 'POMODORO',
        duration: 25,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 25 * 60 * 1000),
        isCompleted: true,
        userId: users[0].id,
        taskId: tasks[0].id,
      },
    }),
    prisma.session.create({
      data: {
        type: 'SHORT_BREAK',
        duration: 5,
        startTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
        endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000 + 5 * 60 * 1000),
        isCompleted: true,
        userId: users[0].id,
      },
    }),
    prisma.session.create({
      data: {
        type: 'POMODORO',
        duration: 25,
        startTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        endTime: new Date(Date.now() - 1 * 60 * 60 * 1000 + 25 * 60 * 1000),
        isCompleted: true,
        userId: users[0].id,
        taskId: tasks[1].id,
      },
    }),
  ]);

  console.log('✅ Created sample sessions');

  // Create daily analytics for all users
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const analyticsData = [
    {
      userId: users[0].id,
      totalPomodoros: 2,
      totalFocusTime: 50,
      totalBreakTime: 5,
      completedTasks: 0,
      streak: 1,
      productivityScore: 85.5,
    },
    {
      userId: users[1].id,
      totalPomodoros: 4,
      totalFocusTime: 200,
      totalBreakTime: 40,
      completedTasks: 1,
      streak: 3,
      productivityScore: 92.3,
    },
    {
      userId: users[2].id,
      totalPomodoros: 1,
      totalFocusTime: 20,
      totalBreakTime: 3,
      completedTasks: 0,
      streak: 1,
      productivityScore: 78.1,
    },
  ];

  await Promise.all(
    analyticsData.map(analytics =>
      prisma.dailyAnalytics.upsert({
        where: {
          userId_date: {
            userId: analytics.userId,
            date: today,
          },
        },
        update: {},
        create: {
          ...analytics,
          date: today,
        },
      })
    )
  );

  console.log('✅ Created daily analytics for all users');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('1. Default User:');
  console.log('   Email: test@pomofocus.com');
  console.log('   Password: password123');
  console.log('   Settings: Standard Pomodoro (25/5/15), Light theme');
  console.log('');
  console.log('2. Power User:');
  console.log('   Email: power@pomofocus.com');
  console.log('   Password: password123');
  console.log(
    '   Settings: Extended sessions (50/10/30), Dark theme, Auto-start enabled'
  );
  console.log('');
  console.log('3. Minimalist User:');
  console.log('   Email: minimal@pomofocus.com');
  console.log('   Password: password123');
  console.log(
    '   Settings: Short sessions (20/3/10), Light theme, Notifications disabled'
  );
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
