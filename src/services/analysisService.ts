import { AppError } from '@/middleware/error';
import prisma from '@/prismaClient';
import { AnalyticsData, AnalyticsQuery } from '@/types';
import { ValidationUtils } from '@/utils/validation';

export class AnalysisService {
  /**
   * Get analytics data for a specific period
   */
  static async getAnalytics(
    userId: string,
    query: AnalyticsQuery
  ): Promise<AnalyticsData> {
    const { start, end } = ValidationUtils.validateDateRange(
      query.startDate,
      query.endDate
    );

    let periodStart: Date;
    let periodEnd: Date;

    switch (query.period) {
      case 'daily':
        periodStart = new Date(start);
        periodEnd = new Date(end);
        break;
      case 'weekly':
        periodStart = new Date(start);
        periodStart.setDate(periodStart.getDate() - periodStart.getDay()); // Start of week
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 6); // End of week
        break;
      case 'monthly':
        periodStart = new Date(start.getFullYear(), start.getMonth(), 1);
        periodEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        break;
      default:
        throw new AppError(
          'Invalid period. Must be daily, weekly, or monthly',
          400
        );
    }

    // Get analytics data
    const analytics = await prisma.dailyAnalytics.findMany({
      where: {
        userId,
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Get session data for additional insights (currently unused but kept for future use)
    // const _sessions = await prisma.session.findMany({
    //   where: {
    //     userId,
    //     startTime: {
    //       gte: periodStart,
    //       lte: periodEnd
    //     },
    //     isCompleted: true
    //   },
    //   orderBy: { startTime: 'asc' }
    // });

    // Calculate totals
    const totals = analytics.reduce(
      (acc, day) => ({
        totalPomodoros: acc.totalPomodoros + day.totalPomodoros,
        totalFocusTime: acc.totalFocusTime + day.totalFocusTime,
        totalBreakTime: acc.totalBreakTime + day.totalBreakTime,
        completedTasks: acc.completedTasks + day.completedTasks,
        productivityScore: acc.productivityScore + day.productivityScore,
      }),
      {
        totalPomodoros: 0,
        totalFocusTime: 0,
        totalBreakTime: 0,
        completedTasks: 0,
        productivityScore: 0,
      }
    );

    // Calculate current streak
    const currentStreak = await this.calculateCurrentStreak(userId);

    // Calculate productivity score
    const productivityScore =
      analytics.length > 0 ? totals.productivityScore / analytics.length : 0;

    // Format data points
    const dataPoints = this.formatDataPoints(analytics);

    return {
      totalPomodoros: totals.totalPomodoros,
      totalFocusTime: totals.totalFocusTime,
      totalBreakTime: totals.totalBreakTime,
      completedTasks: totals.completedTasks,
      streak: currentStreak,
      productivityScore: Math.round(productivityScore * 100) / 100,
      period: query.period,
      data: dataPoints,
    };
  }

  /**
   * Get productivity insights
   */
  static async getProductivityInsights(
    userId: string,
    days: number = 30
  ): Promise<{
    averageDailyPomodoros: number;
    averageSessionDuration: number;
    mostProductiveDay: string;
    mostProductiveHour: number;
    completionRate: number;
    focusRatio: number;
    recommendations: string[];
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await prisma.dailyAnalytics.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        isCompleted: true,
      },
    });

    // Calculate averages
    const totalDays = analytics.length || 1;
    const averageDailyPomodoros =
      analytics.reduce((sum, day) => sum + day.totalPomodoros, 0) / totalDays;

    const pomodoroSessions = sessions.filter(s => s.type === 'POMODORO');
    const averageSessionDuration =
      pomodoroSessions.length > 0
        ? pomodoroSessions.reduce((sum, session) => sum + session.duration, 0) /
          pomodoroSessions.length
        : 0;

    // Find most productive day
    const dayStats = analytics.reduce(
      (acc, day) => {
        const dayName = day.date.toLocaleDateString('en-US', {
          weekday: 'long',
        });
        if (!acc[dayName]) {
          acc[dayName] = { pomodoros: 0, count: 0 };
        }
        acc[dayName].pomodoros += day.totalPomodoros;
        acc[dayName].count += 1;
        return acc;
      },
      {} as Record<string, { pomodoros: number; count: number }>
    );

    const mostProductiveDay =
      Object.entries(dayStats)
        .map(([day, stats]) => ({ day, avg: stats.pomodoros / stats.count }))
        .sort((a, b) => b.avg - a.avg)[0]?.day || 'Monday';

    // Find most productive hour
    const hourStats = sessions.reduce(
      (acc, session) => {
        const hour = session.startTime.getHours();
        if (!acc[hour]) {
          acc[hour] = 0;
        }
        acc[hour] += 1;
        return acc;
      },
      {} as Record<number, number>
    );

    const mostProductiveHour =
      Object.entries(hourStats).sort(([, a], [, b]) => b - a)[0]?.[0] || 9;

    // Calculate completion rate
    const totalTasks = await prisma.task.count({ where: { userId } });
    const completedTasks = await prisma.task.count({
      where: {
        userId,
        status: 'COMPLETED',
      },
    });
    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate focus ratio
    const totalFocusTime = analytics.reduce(
      (sum, day) => sum + day.totalFocusTime,
      0
    );
    const totalBreakTime = analytics.reduce(
      (sum, day) => sum + day.totalBreakTime,
      0
    );
    const focusRatio =
      totalFocusTime + totalBreakTime > 0
        ? totalFocusTime / (totalFocusTime + totalBreakTime)
        : 0;

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      averageDailyPomodoros,
      averageSessionDuration,
      completionRate,
      focusRatio,
    });

    return {
      averageDailyPomodoros: Math.round(averageDailyPomodoros * 100) / 100,
      averageSessionDuration: Math.round(averageSessionDuration * 100) / 100,
      mostProductiveDay,
      mostProductiveHour: parseInt(mostProductiveHour.toString()),
      completionRate: Math.round(completionRate * 100) / 100,
      focusRatio: Math.round(focusRatio * 100) / 100,
      recommendations,
    };
  }

  /**
   * Get streak information
   */
  static async getStreakInfo(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date | null;
    streakGoal: number;
  }> {
    const analytics = await prisma.dailyAnalytics.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    let currentStreak = 0;
    let longestStreak = 0;
    let lastActivityDate: Date | null = null;

    if (analytics.length > 0) {
      lastActivityDate = analytics[0]?.date || null;

      // Calculate streaks
      let tempStreak = 0;
      let maxStreak = 0;

      for (let i = 0; i < analytics.length; i++) {
        // const _currentDate = new Date(analytics[i]?.date || new Date());
        // const _nextDate = i < analytics.length - 1 ? new Date(analytics[i + 1]?.date || new Date()) : null;

        const analyticsItem = analytics[i];
        if (analyticsItem?.totalPomodoros && analyticsItem.totalPomodoros > 0) {
          tempStreak++;
          maxStreak = Math.max(maxStreak, tempStreak);

          if (i === 0) {
            currentStreak = tempStreak;
          }
        } else {
          tempStreak = 0;
        }
      }

      longestStreak = maxStreak;
    }

    return {
      currentStreak,
      longestStreak,
      lastActivityDate,
      streakGoal: 7, // Default goal
    };
  }

  /**
   * Calculate current streak
   */
  private static async calculateCurrentStreak(userId: string): Promise<number> {
    const analytics = await prisma.dailyAnalytics.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < analytics.length; i++) {
      const analyticsItem = analytics[i];
      const analyticsDate = new Date(analyticsItem?.date || new Date());
      analyticsDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (
        analyticsDate.getTime() === expectedDate.getTime() &&
        analyticsItem?.totalPomodoros &&
        analyticsItem.totalPomodoros > 0
      ) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Format data points for different periods
   */
  private static formatDataPoints(analytics: any[]): Array<{
    date: string;
    pomodoros: number;
    focusTime: number;
    breakTime: number;
    completedTasks: number;
    productivityScore: number;
  }> {
    return analytics.map(day => ({
      date:
        day?.date?.toISOString()?.split('T')[0] ||
        new Date().toISOString().split('T')[0],
      pomodoros: day?.totalPomodoros || 0,
      focusTime: day?.totalFocusTime || 0,
      breakTime: day?.totalBreakTime || 0,
      completedTasks: day?.completedTasks || 0,
      productivityScore: day?.productivityScore || 0,
    }));
  }

  /**
   * Generate recommendations based on analytics
   */
  private static generateRecommendations(insights: {
    averageDailyPomodoros: number;
    averageSessionDuration: number;
    completionRate: number;
    focusRatio: number;
  }): string[] {
    const recommendations: string[] = [];

    if (insights.averageDailyPomodoros < 4) {
      recommendations.push(
        'Try to complete at least 4 pomodoros per day for better productivity'
      );
    }

    if (insights.averageSessionDuration < 20) {
      recommendations.push(
        'Consider extending your focus sessions to 25 minutes for better deep work'
      );
    }

    if (insights.completionRate < 70) {
      recommendations.push(
        'Break down large tasks into smaller, manageable chunks'
      );
    }

    if (insights.focusRatio < 0.8) {
      recommendations.push(
        'Try to maintain a higher focus-to-break ratio for better productivity'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Great job! Keep maintaining your current productivity habits'
      );
    }

    return recommendations;
  }
}
