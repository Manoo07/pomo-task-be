import { AuthMiddleware, ErrorMiddleware } from '@/middleware';
import { TaskService } from '@/services/taskService';
import {
  ApiResponse,
  CreateTaskRequest,
  PaginatedResponse,
  UpdateTaskRequest,
} from '@/types';
import { ValidationUtils } from '@/utils/validation';
import { Request, Response, Router } from 'express';
import Joi from 'joi';

const router = Router();

// Validation schemas
const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
  estimatedPomodoros: Joi.number().integer().min(1).max(50).optional(),
  trackId: Joi.string().optional(),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  status: Joi.string()
    .valid('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
    .optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
  estimatedPomodoros: Joi.number().integer().min(1).max(50).optional(),
  completedPomodoros: Joi.number().integer().min(0).max(50).optional(),
  trackId: Joi.string().optional(),
});

const getTasksSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  status: Joi.string()
    .valid('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
    .optional(),
  trackId: Joi.string().optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
});

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post(
  '/',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createTaskSchema.validate(req.body);

    if (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation error',
        error: error.details[0]?.message || 'Validation failed',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const task = await TaskService.createTask(
      (req as any).user.id,
      value as CreateTaskRequest
    );

    const response: ApiResponse = {
      success: true,
      message: 'Task created successfully',
      data: { task },
      timestamp: new Date().toISOString(),
    };

    return res.status(201).json(response);
  })
);

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for the authenticated user
 * @access  Private
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = getTasksSchema.validate(req.query);

    if (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation error',
        error: error.details[0]?.message || 'Validation failed',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const { page, limit } = ValidationUtils.validatePagination(
      value.page?.toString(),
      value.limit?.toString()
    );

    const result = await TaskService.getUserTasks(
      (req as any).user.id,
      page,
      limit,
      value.status,
      value.trackId,
      value.priority
    );

    const response: PaginatedResponse<any> = {
      success: true,
      message: 'Tasks retrieved successfully',
      data: result.tasks,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   GET /api/tasks/stats
 * @desc    Get task statistics for the authenticated user
 * @access  Private
 */
router.get(
  '/stats',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const stats = await TaskService.getTaskStats((req as any).user.id);

    const response: ApiResponse = {
      success: true,
      message: 'Task statistics retrieved successfully',
      data: { stats },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get a single task by ID
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
        message: 'Task ID is required',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const task = await TaskService.getTaskById(id, (req as any).user.id);

    const response: ApiResponse = {
      success: true,
      message: 'Task retrieved successfully',
      data: { task },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update a task
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
        message: 'Task ID is required',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const { error, value } = updateTaskSchema.validate(req.body);

    if (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation error',
        error: error.details[0]?.message || 'Validation failed',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const task = await TaskService.updateTask(
      id,
      (req as any).user.id,
      value as UpdateTaskRequest
    );

    const response: ApiResponse = {
      success: true,
      message: 'Task updated successfully',
      data: { task },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task
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
        message: 'Task ID is required',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    await TaskService.deleteTask(id, (req as any).user.id);

    const response: ApiResponse = {
      success: true,
      message: 'Task deleted successfully',
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   GET /api/tasks/track/:trackId
 * @desc    Get tasks by learning track
 * @access  Private
 */
router.get(
  '/track/:trackId',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { trackId } = req.params;

    if (!trackId) {
      const response: ApiResponse = {
        success: false,
        message: 'Track ID is required',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const tasks = await TaskService.getTasksByTrack(
      trackId,
      (req as any).user.id
    );

    const response: ApiResponse = {
      success: true,
      message: 'Tasks retrieved successfully',
      data: { tasks },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

export default router;
