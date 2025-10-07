import { AuthMiddleware, ErrorMiddleware } from '@/middleware';
import { LearningTrackService } from '@/services/trackService';
import { ApiResponse, CreateTrackRequest, UpdateTrackRequest } from '@/types';
import { Request, Response, Router } from 'express';
import Joi from 'joi';

const router = Router();

// Validation schemas
const createTrackSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  color: Joi.string()
    .pattern(/^#[0-9A-F]{6}$/i)
    .optional(),
  icon: Joi.string().max(10).optional(),
});

const updateTrackSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(500).optional(),
  color: Joi.string()
    .pattern(/^#[0-9A-F]{6}$/i)
    .optional(),
  icon: Joi.string().max(10).optional(),
});

const searchSchema = Joi.object({
  q: Joi.string().min(1).max(100).required(),
});

/**
 * @route   POST /api/tracks
 * @desc    Create a new learning track
 * @access  Private
 */
router.post(
  '/',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createTrackSchema.validate(req.body);

    if (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation error',
        error: error.details[0]?.message || 'Validation failed',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const track = await LearningTrackService.createTrack(
      (req as any).user.id,
      value as CreateTrackRequest
    );

    const response: ApiResponse = {
      success: true,
      message: 'Learning track created successfully',
      data: { track },
      timestamp: new Date().toISOString(),
    };

    return res.status(201).json(response);
  })
);

/**
 * @route   GET /api/tracks
 * @desc    Get all learning tracks for the authenticated user
 * @access  Private
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const tracks = await LearningTrackService.getUserTracks(
      (req as any).user.id
    );

    const response: ApiResponse = {
      success: true,
      message: 'Learning tracks retrieved successfully',
      data: { tracks },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   GET /api/tracks/stats
 * @desc    Get learning track statistics for the authenticated user
 * @access  Private
 */
router.get(
  '/stats',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const stats = await LearningTrackService.getTrackStats(
      (req as any).user.id
    );

    const response: ApiResponse = {
      success: true,
      message: 'Learning track statistics retrieved successfully',
      data: { stats },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   GET /api/tracks/popular
 * @desc    Get popular learning tracks (most tasks)
 * @access  Private
 */
router.get(
  '/popular',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query['limit'] as string) || 5;

    const tracks = await LearningTrackService.getPopularTracks(
      (req as any).user.id,
      limit
    );

    const response: ApiResponse = {
      success: true,
      message: 'Popular learning tracks retrieved successfully',
      data: { tracks },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   GET /api/tracks/search
 * @desc    Search learning tracks by name
 * @access  Private
 */
router.get(
  '/search',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = searchSchema.validate(req.query);

    if (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation error',
        error: error.details[0]?.message || 'Validation failed',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const tracks = await LearningTrackService.searchTracks(
      (req as any).user.id,
      value.q
    );

    const response: ApiResponse = {
      success: true,
      message: 'Search results retrieved successfully',
      data: { tracks },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   GET /api/tracks/:id
 * @desc    Get a single learning track by ID
 * @access  Private
 */
router.get(
  '/:id',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        message: 'Track ID is required',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const track = await LearningTrackService.getTrackById(
      id,
      (req as any).user.id
    );

    const response: ApiResponse = {
      success: true,
      message: 'Learning track retrieved successfully',
      data: { track },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   PUT /api/tracks/:id
 * @desc    Update a learning track
 * @access  Private
 */
router.put(
  '/:id',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        message: 'Track ID is required',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const { error, value } = updateTrackSchema.validate(req.body);

    if (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation error',
        error: error.details[0]?.message || 'Validation failed',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const track = await LearningTrackService.updateTrack(
      id,
      (req as any).user.id,
      value as UpdateTrackRequest
    );

    const response: ApiResponse = {
      success: true,
      message: 'Learning track updated successfully',
      data: { track },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   DELETE /api/tracks/:id
 * @desc    Delete a learning track
 * @access  Private
 */
router.delete(
  '/:id',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        message: 'Track ID is required',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    await LearningTrackService.deleteTrack(id, (req as any).user.id);

    const response: ApiResponse = {
      success: true,
      message: 'Learning track deleted successfully',
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   DELETE /api/tracks/:id/force
 * @desc    Delete learning track with options for handling tasks
 * @access  Private
 */
router.delete(
  '/:id/force',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { moveTasksToTrackId, deleteTasks } = req.body;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        message: 'Track ID is required',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    // Validate options
    if (!moveTasksToTrackId && !deleteTasks) {
      const response: ApiResponse = {
        success: false,
        message: 'Either moveTasksToTrackId or deleteTasks must be provided',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const result = await LearningTrackService.deleteTrackWithOptions(
      id,
      (req as any).user.id,
      {
        moveTasksToTrackId,
        deleteTasks,
      }
    );

    const response: ApiResponse = {
      success: true,
      message: 'Learning track deleted successfully',
      data: {
        deletedTasks: result.deletedTasks,
        movedTasks: result.movedTasks,
      },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

export default router;
