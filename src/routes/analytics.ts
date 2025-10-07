import { AuthMiddleware, ErrorMiddleware } from '@/middleware';
import { AnalysisService } from '@/services/analysisService';
import { AnalyticsQuery, ApiResponse } from '@/types';
import { Request, Response, Router } from 'express';
import Joi from 'joi';

const router = Router();

// Validation schemas
const analyticsQuerySchema = Joi.object({
  period: Joi.string().valid('daily', 'weekly', 'monthly').required(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
});

const insightsQuerySchema = Joi.object({
  days: Joi.number().integer().min(7).max(365).optional(),
});

/**
 * @route   GET /api/analytics
 * @desc    Get analytics data for a specific period
 * @access  Private
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = analyticsQuerySchema.validate(req.query);

    if (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation error',
        error: error.details[0]?.message || 'Validation failed',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const analytics = await AnalysisService.getAnalytics(
      (req as any).user.id,
      value as AnalyticsQuery
    );

    const response: ApiResponse = {
      success: true,
      message: 'Analytics data retrieved successfully',
      data: { analytics },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   GET /api/analytics/insights
 * @desc    Get productivity insights and recommendations
 * @access  Private
 */
router.get(
  '/insights',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = insightsQuerySchema.validate(req.query);

    if (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation error',
        error: error.details[0]?.message || 'Validation failed',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const insights = await AnalysisService.getProductivityInsights(
      (req as any).user.id,
      value?.days || 30
    );

    const response: ApiResponse = {
      success: true,
      message: 'Productivity insights retrieved successfully',
      data: { insights },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   GET /api/analytics/streak
 * @desc    Get streak information
 * @access  Private
 */
router.get(
  '/streak',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const streakInfo = await AnalysisService.getStreakInfo(
      (req as any).user.id
    );

    const response: ApiResponse = {
      success: true,
      message: 'Streak information retrieved successfully',
      data: { streakInfo },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   GET /api/analytics/daily
 * @desc    Get daily analytics for the current day
 * @access  Private
 */
router.get(
  '/daily',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query: AnalyticsQuery = {
      period: 'daily',
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
    };

    const analytics = await AnalysisService.getAnalytics(
      (req as any).user.id,
      query
    );

    const response: ApiResponse = {
      success: true,
      message: 'Daily analytics retrieved successfully',
      data: { analytics },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   GET /api/analytics/weekly
 * @desc    Get weekly analytics for the current week
 * @access  Private
 */
router.get(
  '/weekly',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const query: AnalyticsQuery = {
      period: 'weekly',
      startDate: startOfWeek.toISOString(),
      endDate: endOfWeek.toISOString(),
    };

    const analytics = await AnalysisService.getAnalytics(
      (req as any).user.id,
      query
    );

    const response: ApiResponse = {
      success: true,
      message: 'Weekly analytics retrieved successfully',
      data: { analytics },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   GET /api/analytics/monthly
 * @desc    Get monthly analytics for the current month
 * @access  Private
 */
router.get(
  '/monthly',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const query: AnalyticsQuery = {
      period: 'monthly',
      startDate: startOfMonth.toISOString(),
      endDate: endOfMonth.toISOString(),
    };

    const analytics = await AnalysisService.getAnalytics(
      (req as any).user.id,
      query
    );

    const response: ApiResponse = {
      success: true,
      message: 'Monthly analytics retrieved successfully',
      data: { analytics },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

export default router;
