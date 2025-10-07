import { AppError } from '@/middleware/error';
import prisma from '@/prismaClient';
import { CompleteSessionRequest, StartSessionRequest } from '@/types';
import { Session, SessionType } from '@prisma/client';

export class SessionService {
  /**
   * Start a new session
   */
  static async startSession(
    userId: string,
    data: StartSessionRequest
  ): Promise<Session> {
    // Validate task ownership if taskId is provided
    if (data.taskId) {
      const task = await prisma.task.findFirst({
        where: {
          id: data.taskId,
          userId: userId,
        },
      });

      if (!task) {
        throw new AppError('Task not found or access denied', 404);
      }
    }

    // Get user settings for default durations
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      throw new AppError('User settings not found', 404);
    }

    // Determine session duration based on type
    let duration: number;
    switch (data.type) {
      case 'POMODORO':
        duration = settings.pomodoroDuration;
        break;
      case 'SHORT_BREAK':
        duration = settings.shortBreakDuration;
        break;
      case 'LONG_BREAK':
        duration = settings.longBreakDuration;
        break;
      default:
        throw new AppError('Invalid session type', 400);
    }

    // Check if user has an active session
    const activeSession = await prisma.session.findFirst({
      where: {
        userId: userId,
        isCompleted: false,
        endTime: null,
      },
    });

    if (activeSession) {
      throw new AppError('User already has an active session', 400);
    }

    const session = await prisma.session.create({
      data: {
        type: data.type,
        duration: duration,
        startTime: new Date(),
        userId: userId,
        taskId: data.taskId || null,
        isCompleted: false,
      },
      include: {
        task: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return session;
  }

  /**
   * Complete a session
   */
  static async completeSession(
    sessionId: string,
    userId: string,
    data?: CompleteSessionRequest
  ): Promise<Session> {
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId: userId,
        isCompleted: false,
      },
      include: {
        task: true,
      },
    });

    if (!session) {
      throw new AppError('Active session not found', 404);
    }

    const endTime = new Date();
    const actualDuration =
      data?.duration ||
      Math.floor(
        (endTime.getTime() - session.startTime.getTime()) / (1000 * 60)
      );

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        endTime: endTime,
        duration: actualDuration,
        isCompleted: true,
      },
      include: {
        task: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update task completed pomodoros if it's a pomodoro session
    if (session.type === 'POMODORO' && session.taskId) {
      await prisma.task.update({
        where: { id: session.taskId },
        data: {
          completedPomodoros: {
            increment: 1,
          },
        },
      });
    }

    // Update daily analytics
    await this.updateDailyAnalytics(userId, session.type, actualDuration);

    return updatedSession;
  }

  /**
   * Get active session for a user
   */
  static async getActiveSession(userId: string): Promise<Session | null> {
    const session = await prisma.session.findFirst({
      where: {
        userId: userId,
        isCompleted: false,
        endTime: null,
      },
      include: {
        task: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return session;
  }

  /**
   * Get session history for a user
   */
  static async getSessionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    type?: SessionType,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ sessions: Session[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: any = {
      userId: userId,
      isCompleted: true,
    };

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = startDate;
      }
      if (endDate) {
        where.startTime.lte = endDate;
      }
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          task: true,
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.session.count({ where }),
    ]);

    return { sessions, total };
  }

  /**
   * Get session statistics for a user
   */
  static async getSessionStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalSessions: number;
    totalPomodoros: number;
    totalShortBreaks: number;
    totalLongBreaks: number;
    totalFocusTime: number;
    totalBreakTime: number;
    averageSessionDuration: number;
    longestStreak: number;
    currentStreak: number;
  }> {
    const where: any = {
      userId: userId,
      isCompleted: true,
    };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = startDate;
      }
      if (endDate) {
        where.startTime.lte = endDate;
      }
    }

    const sessions = await prisma.session.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });

    const stats = {
      totalSessions: sessions.length,
      totalPomodoros: 0,
      totalShortBreaks: 0,
      totalLongBreaks: 0,
      totalFocusTime: 0,
      totalBreakTime: 0,
      averageSessionDuration: 0,
      longestStreak: 0,
      currentStreak: 0,
    };

    let currentStreak = 0;
    let longestStreak = 0;
    let lastSessionDate: Date | null = null;

    sessions.forEach(session => {
      switch (session.type) {
        case 'POMODORO':
          stats.totalPomodoros++;
          stats.totalFocusTime += session.duration;
          break;
        case 'SHORT_BREAK':
          stats.totalShortBreaks++;
          stats.totalBreakTime += session.duration;
          break;
        case 'LONG_BREAK':
          stats.totalLongBreaks++;
          stats.totalBreakTime += session.duration;
          break;
      }

      // Calculate streaks
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);

      if (lastSessionDate) {
        const daysDiff = Math.floor(
          (sessionDate.getTime() - lastSessionDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          currentStreak++;
        } else if (daysDiff > 1) {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      lastSessionDate = sessionDate;
    });

    stats.longestStreak = Math.max(longestStreak, currentStreak);
    stats.currentStreak = currentStreak;
    stats.averageSessionDuration =
      stats.totalSessions > 0
        ? Math.round(
            ((stats.totalFocusTime + stats.totalBreakTime) /
              stats.totalSessions) *
              100
          ) / 100
        : 0;

    return stats;
  }

  /**
   * Update daily analytics
   */
  private static async updateDailyAnalytics(
    userId: string,
    sessionType: SessionType,
    duration: number
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analytics = await prisma.dailyAnalytics.findUnique({
      where: {
        userId_date: {
          userId: userId,
          date: today,
        },
      },
    });

    if (analytics) {
      const updateData: any = {};

      if (sessionType === 'POMODORO') {
        updateData.totalPomodoros = { increment: 1 };
        updateData.totalFocusTime = { increment: duration };
      } else {
        updateData.totalBreakTime = { increment: duration };
      }

      await prisma.dailyAnalytics.update({
        where: {
          userId_date: {
            userId: userId,
            date: today,
          },
        },
        data: updateData,
      });
    } else {
      const initialData: any = {
        userId: userId,
        date: today,
        totalPomodoros: 0,
        totalFocusTime: 0,
        totalBreakTime: 0,
        completedTasks: 0,
        streak: 1,
        productivityScore: 0,
      };

      if (sessionType === 'POMODORO') {
        initialData.totalPomodoros = 1;
        initialData.totalFocusTime = duration;
      } else {
        initialData.totalBreakTime = duration;
      }

      await prisma.dailyAnalytics.create({
        data: initialData,
      });
    }
  }

  /**
   * Cancel an active session
   */
  static async cancelSession(sessionId: string, userId: string): Promise<void> {
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId: userId,
        isCompleted: false,
      },
    });

    if (!session) {
      throw new AppError('Active session not found', 404);
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
        isCompleted: true,
      },
    });
  }
}
