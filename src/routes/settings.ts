import { AuthMiddleware, ErrorMiddleware } from '@/middleware';
import { SettingsService } from '@/services/settingsService';
import { ApiResponse, UpdateSettingsRequest } from '@/types';
import { Request, Response, Router } from 'express';
import Joi from 'joi';

const router = Router();

// Validation schema
const updateSettingsSchema = Joi.object({
  pomodoroDuration: Joi.number().integer().min(1).max(60).optional(),
  shortBreakDuration: Joi.number().integer().min(1).max(30).optional(),
  longBreakDuration: Joi.number().integer().min(1).max(60).optional(),
  longBreakInterval: Joi.number().integer().min(2).max(10).optional(),
  autoStartBreaks: Joi.boolean().optional(),
  autoStartPomodoros: Joi.boolean().optional(),
  soundEnabled: Joi.boolean().optional(),
  desktopNotifications: Joi.boolean().optional(),
  emailNotifications: Joi.boolean().optional(),
  theme: Joi.string().valid('light', 'dark', 'auto').optional(),
  language: Joi.string()
    .valid('en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh')
    .optional(),
});

/**
 * @route   GET /api/settings
 * @desc    Get user settings
 * @access  Private
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const settings = await SettingsService.getUserSettings(
      (req as any).user.id
    );

    const response: ApiResponse = {
      success: true,
      message: 'Settings retrieved successfully',
      data: { settings },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   PUT /api/settings
 * @desc    Update user settings
 * @access  Private
 */
router.put(
  '/',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = updateSettingsSchema.validate(req.body);

    if (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation error',
        error: error.details[0]?.message || 'Validation failed',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const settings = await SettingsService.updateUserSettings(
      (req as any).user.id,
      value as UpdateSettingsRequest
    );

    const response: ApiResponse = {
      success: true,
      message: 'Settings updated successfully',
      data: { settings },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   POST /api/settings/reset
 * @desc    Reset settings to default values
 * @access  Private
 */
router.post(
  '/reset',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const settings = await SettingsService.resetToDefaults(
      (req as any).user.id
    );

    const response: ApiResponse = {
      success: true,
      message: 'Settings reset to default values',
      data: { settings },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   GET /api/settings/themes
 * @desc    Get available themes
 * @access  Public
 */
router.get(
  '/themes',
  ErrorMiddleware.asyncHandler(async (_req: Request, res: Response) => {
    const themes = SettingsService.getAvailableThemes();

    const response: ApiResponse = {
      success: true,
      message: 'Available themes retrieved successfully',
      data: { themes },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   GET /api/settings/languages
 * @desc    Get available languages
 * @access  Public
 */
router.get(
  '/languages',
  ErrorMiddleware.asyncHandler(async (_req: Request, res: Response) => {
    const languages = SettingsService.getAvailableLanguages();

    const response: ApiResponse = {
      success: true,
      message: 'Available languages retrieved successfully',
      data: { languages },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

export default router;
