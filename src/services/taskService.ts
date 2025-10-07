import { AppError } from '@/middleware/error';
import prisma from '@/prismaClient';
import { CreateTaskRequest, UpdateTaskRequest } from '@/types';
import { ValidationUtils } from '@/utils/validation';
import { Priority, Task, TaskStatus } from '@prisma/client';

export class TaskService {
  /**
   * Create a new task
   */
  static async createTask(
    userId: string,
    data: CreateTaskRequest
  ): Promise<Task> {
    // Validate track ownership if trackId is provided
    if (data.trackId) {
      const track = await prisma.learningTrack.findFirst({
        where: {
          id: data.trackId,
          userId: userId,
        },
      });

      if (!track) {
        throw new AppError('Learning track not found or access denied', 404);
      }
    }

    const task = await prisma.task.create({
      data: {
        title: ValidationUtils.sanitizeString(data.title),
        description: data.description
          ? ValidationUtils.sanitizeString(data.description)
          : null,
        priority: data.priority || 'MEDIUM',
        estimatedPomodoros: data.estimatedPomodoros || 1,
        userId: userId,
        trackId: data.trackId || null,
      },
      include: {
        track: true,
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

    return task;
  }

  /**
   * Get all tasks for a user
   */
  static async getUserTasks(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: TaskStatus,
    trackId?: string,
    priority?: Priority
  ): Promise<{ tasks: Task[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: any = {
      userId: userId,
    };

    if (status) {
      where.status = status;
    }

    if (trackId) {
      where.trackId = trackId;
    }

    if (priority) {
      where.priority = priority;
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          track: true,
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
      prisma.task.count({ where }),
    ]);

    return { tasks, total };
  }

  /**
   * Get a single task by ID
   */
  static async getTaskById(taskId: string, userId: string): Promise<Task> {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: userId,
      },
      include: {
        track: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        sessions: {
          orderBy: {
            startTime: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return task;
  }

  /**
   * Update a task
   */
  static async updateTask(
    taskId: string,
    userId: string,
    data: UpdateTaskRequest
  ): Promise<Task> {
    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: userId,
      },
    });

    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    // Validate track ownership if trackId is provided
    if (data.trackId) {
      const track = await prisma.learningTrack.findFirst({
        where: {
          id: data.trackId,
          userId: userId,
        },
      });

      if (!track) {
        throw new AppError('Learning track not found or access denied', 404);
      }
    }

    const updateData: any = {};

    if (data.title !== undefined) {
      updateData.title = ValidationUtils.sanitizeString(data.title);
    }
    if (data.description !== undefined) {
      updateData.description = data.description
        ? ValidationUtils.sanitizeString(data.description)
        : null;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }
    if (data.estimatedPomodoros !== undefined) {
      updateData.estimatedPomodoros = data.estimatedPomodoros;
    }
    if (data.completedPomodoros !== undefined) {
      updateData.completedPomodoros = data.completedPomodoros;
    }
    if (data.trackId !== undefined) {
      updateData.trackId = data.trackId || null;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        track: true,
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

    return task;
  }

  /**
   * Delete a task
   */
  static async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: userId,
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    await prisma.task.delete({
      where: { id: taskId },
    });
  }

  /**
   * Get task statistics for a user
   */
  static async getTaskStats(userId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    cancelled: number;
    totalEstimatedPomodoros: number;
    totalCompletedPomodoros: number;
  }> {
    const stats = await prisma.task.groupBy({
      by: ['status'],
      where: { userId },
      _count: {
        id: true,
      },
      _sum: {
        estimatedPomodoros: true,
        completedPomodoros: true,
      },
    });

    const result = {
      total: 0,
      completed: 0,
      inProgress: 0,
      todo: 0,
      cancelled: 0,
      totalEstimatedPomodoros: 0,
      totalCompletedPomodoros: 0,
    };

    stats.forEach(stat => {
      const count = stat._count.id;
      const estimatedPomodoros = stat._sum.estimatedPomodoros || 0;
      const completedPomodoros = stat._sum.completedPomodoros || 0;

      result.total += count;
      result.totalEstimatedPomodoros += estimatedPomodoros;
      result.totalCompletedPomodoros += completedPomodoros;

      switch (stat.status) {
        case 'COMPLETED':
          result.completed = count;
          break;
        case 'IN_PROGRESS':
          result.inProgress = count;
          break;
        case 'TODO':
          result.todo = count;
          break;
        case 'CANCELLED':
          result.cancelled = count;
          break;
      }
    });

    return result;
  }

  /**
   * Get tasks by learning track
   */
  static async getTasksByTrack(
    trackId: string,
    userId: string
  ): Promise<Task[]> {
    // Verify track ownership
    const track = await prisma.learningTrack.findFirst({
      where: {
        id: trackId,
        userId: userId,
      },
    });

    if (!track) {
      throw new AppError('Learning track not found', 404);
    }

    const tasks = await prisma.task.findMany({
      where: {
        trackId: trackId,
        userId: userId,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        track: true,
      },
    });

    return tasks;
  }
}
