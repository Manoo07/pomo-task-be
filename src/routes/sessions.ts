import { AuthMiddleware, ErrorMiddleware } from '@/middleware';
import { SessionService } from '@/services/sessionService';
import {
  ApiResponse,
  CompleteSessionRequest,
  PaginatedResponse,
  StartSessionRequest,
} from '@/types';
import { ValidationUtils } from '@/utils/validation';
import { Request, Response, Router } from 'express';
import Joi from 'joi';

const router = Router();

// Validation schemas
const startSessionSchema = Joi.object({
  type: Joi.string().valid('POMODORO', 'SHORT_BREAK', 'LONG_BREAK').required(),
  taskId: Joi.string().optional(),
});

const completeSessionSchema = Joi.object({
  duration: Joi.number().integer().min(1).max(120).optional(),
});

const getHistorySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  type: Joi.string().valid('POMODORO', 'SHORT_BREAK', 'LONG_BREAK').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
});

/**
 * @route   POST /api/sessions/start
 * @desc    Start a new session
 * @access  Private
 */
router.post(
  '/start',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = startSessionSchema.validate(req.body);

    if (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation error',
        error: error.details[0]?.message || 'Validation failed',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const session = await SessionService.startSession(
      (req as any).user.id,
      value as StartSessionRequest
    );

    const response: ApiResponse = {
      success: true,
      message: 'Session started successfully',
      data: { session },
      timestamp: new Date().toISOString(),
    };

    return res.status(201).json(response);
  })
);

/**
 * @route   POST /api/sessions/:id/complete
 * @desc    Complete a session
 * @access  Private
 */
router.post(
  '/:id/complete',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        message: 'Session ID is required',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const { error, value } = completeSessionSchema.validate(req.body);

    if (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation error',
        error: error.details[0]?.message || 'Validation failed',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const session = await SessionService.completeSession(
      id,
      (req as any).user.id,
      value as CompleteSessionRequest
    );

    const response: ApiResponse = {
      success: true,
      message: 'Session completed successfully',
      data: { session },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   POST /api/sessions/:id/cancel
 * @desc    Cancel an active session
 * @access  Private
 */
router.post(
  '/:id/cancel',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        message: 'Session ID is required',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    await SessionService.cancelSession(id, (req as any).user.id);

    const response: ApiResponse = {
      success: true,
      message: 'Session cancelled successfully',
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   GET /api/sessions/active
 * @desc    Get active session for the authenticated user
 * @access  Private
 */
router.get(
  '/active',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const session = await SessionService.getActiveSession((req as any).user.id);

    const response: ApiResponse = {
      success: true,
      message: 'Active session retrieved successfully',
      data: { session },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   GET /api/sessions/history
 * @desc    Get session history for the authenticated user
 * @access  Private
 */
router.get(
  '/history',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = getHistorySchema.validate(req.query);

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

    const result = await SessionService.getSessionHistory(
      (req as any).user.id,
      page,
      limit,
      value.type,
      value.startDate,
      value.endDate
    );

    const response: PaginatedResponse<any> = {
      success: true,
      message: 'Session history retrieved successfully',
      data: result.sessions,
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
 * @route   GET /api/sessions/stats
 * @desc    Get session statistics for the authenticated user
 * @access  Private
 */
router.get(
  '/stats',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { start, end } = ValidationUtils.validateDateRange(
      req.query['startDate'] as string,
      req.query['endDate'] as string
    );

    const stats = await SessionService.getSessionStats(
      (req as any).user.id,
      start,
      end
    );

    const response: ApiResponse = {
      success: true,
      message: 'Session statistics retrieved successfully',
      data: { stats },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

export default router;
