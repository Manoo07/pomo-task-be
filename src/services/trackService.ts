import { AppError } from '@/middleware/error';
import prisma from '@/prismaClient';
import { CreateTrackRequest, UpdateTrackRequest } from '@/types';
import { ValidationUtils } from '@/utils/validation';
import { LearningTrack } from '@prisma/client';

export class LearningTrackService {
  /**
   * Create a new learning track
   */
  static async createTrack(
    userId: string,
    data: CreateTrackRequest
  ): Promise<LearningTrack> {
    const track = await prisma.learningTrack.create({
      data: {
        name: ValidationUtils.sanitizeString(data.name),
        description: data.description
          ? ValidationUtils.sanitizeString(data.description)
          : null,
        color: data.color || '#3B82F6',
        icon: data.icon || null,
        userId: userId,
      },
    });

    return track;
  }

  /**
   * Get all learning tracks for a user
   */
  static async getUserTracks(userId: string): Promise<LearningTrack[]> {
    const tracks = await prisma.learningTrack.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return tracks;
  }

  /**
   * Get a single learning track by ID
   */
  static async getTrackById(
    trackId: string,
    userId: string
  ): Promise<LearningTrack> {
    const track = await prisma.learningTrack.findFirst({
      where: {
        id: trackId,
        userId: userId,
      },
      include: {
        tasks: {
          orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!track) {
      throw new AppError('Learning track not found', 404);
    }

    return track;
  }

  /**
   * Update a learning track
   */
  static async updateTrack(
    trackId: string,
    userId: string,
    data: UpdateTrackRequest
  ): Promise<LearningTrack> {
    // Check if track exists and belongs to user
    const existingTrack = await prisma.learningTrack.findFirst({
      where: {
        id: trackId,
        userId: userId,
      },
    });

    if (!existingTrack) {
      throw new AppError('Learning track not found', 404);
    }

    const updateData: any = {};

    if (data.name !== undefined) {
      updateData.name = ValidationUtils.sanitizeString(data.name);
    }
    if (data.description !== undefined) {
      updateData.description = data.description
        ? ValidationUtils.sanitizeString(data.description)
        : null;
    }
    if (data.color !== undefined) {
      updateData.color = data.color;
    }
    if (data.icon !== undefined) {
      updateData.icon = data.icon;
    }

    const track = await prisma.learningTrack.update({
      where: { id: trackId },
      data: updateData,
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return track;
  }

  /**
   * Delete a learning track
   */
  static async deleteTrack(trackId: string, userId: string): Promise<void> {
    const track = await prisma.learningTrack.findFirst({
      where: {
        id: trackId,
        userId: userId,
      },
    });

    if (!track) {
      throw new AppError('Learning track not found', 404);
    }

    // Check if track has tasks
    const taskCount = await prisma.task.count({
      where: { trackId: trackId },
    });

    if (taskCount > 0) {
      throw new AppError(
        'Cannot delete learning track with existing tasks. Please move or delete tasks first.',
        400
      );
    }

    await prisma.learningTrack.delete({
      where: { id: trackId },
    });
  }

  /**
   * Delete a learning track with options for handling associated tasks
   */
  static async deleteTrackWithOptions(
    trackId: string,
    userId: string,
    options: {
      moveTasksToTrackId?: string;
      deleteTasks?: boolean;
    } = {}
  ): Promise<{ deletedTasks: number; movedTasks: number }> {
    const track = await prisma.learningTrack.findFirst({
      where: {
        id: trackId,
        userId: userId,
      },
    });

    if (!track) {
      throw new AppError('Learning track not found', 404);
    }

    // Get all tasks in this track
    const tasks = await prisma.task.findMany({
      where: { trackId: trackId },
      select: { id: true },
    });

    let deletedTasks = 0;
    let movedTasks = 0;

    if (tasks.length > 0) {
      if (options.deleteTasks) {
        // Delete all tasks in this track
        await prisma.task.deleteMany({
          where: { trackId: trackId },
        });
        deletedTasks = tasks.length;
      } else if (options.moveTasksToTrackId) {
        // Verify the target track exists and belongs to the user
        const targetTrack = await prisma.learningTrack.findFirst({
          where: {
            id: options.moveTasksToTrackId,
            userId: userId,
          },
        });

        if (!targetTrack) {
          throw new AppError('Target track not found', 404);
        }

        // Move tasks to the target track
        await prisma.task.updateMany({
          where: { trackId: trackId },
          data: { trackId: options.moveTasksToTrackId },
        });
        movedTasks = tasks.length;
      } else {
        throw new AppError(
          'Cannot delete learning track with existing tasks. Please provide moveTasksToTrackId or set deleteTasks to true.',
          400
        );
      }
    }

    // Delete the track
    await prisma.learningTrack.delete({
      where: { id: trackId },
    });

    return { deletedTasks, movedTasks };
  }

  /**
   * Get track statistics for a user
   */
  static async getTrackStats(userId: string): Promise<{
    totalTracks: number;
    totalTasks: number;
    tracksWithTasks: number;
    averageTasksPerTrack: number;
  }> {
    const tracks = await prisma.learningTrack.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    const totalTracks = tracks.length;
    const totalTasks = tracks.reduce(
      (sum, track) => sum + track._count.tasks,
      0
    );
    const tracksWithTasks = tracks.filter(
      track => track._count.tasks > 0
    ).length;
    const averageTasksPerTrack = totalTracks > 0 ? totalTasks / totalTracks : 0;

    return {
      totalTracks,
      totalTasks,
      tracksWithTasks,
      averageTasksPerTrack: Math.round(averageTasksPerTrack * 100) / 100,
    };
  }

  /**
   * Get popular tracks (most tasks)
   */
  static async getPopularTracks(
    userId: string,
    limit: number = 5
  ): Promise<LearningTrack[]> {
    const tracks = await prisma.learningTrack.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        tasks: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return tracks;
  }

  /**
   * Search tracks by name
   */
  static async searchTracks(
    userId: string,
    query: string
  ): Promise<LearningTrack[]> {
    const tracks = await prisma.learningTrack.findMany({
      where: {
        userId,
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tracks;
  }
}
