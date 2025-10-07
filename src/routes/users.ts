import { AuthMiddleware, ErrorMiddleware } from '@/middleware';
import { UserService } from '@/services/userService';
import { ApiResponse, UpdateProfileRequest } from '@/types';
import { Request, Response, Router } from 'express';
import Joi from 'joi';

const router = Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional(),
  avatar: Joi.string().uri().optional(),
});

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get(
  '/profile',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const user = await UserService.getProfile((req as any).user.id);

    const response: ApiResponse = {
      success: true,
      message: 'Profile retrieved successfully',
      data: { user },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = updateProfileSchema.validate(req.body);

    if (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation error',
        error: error.details[0]?.message || 'Validation failed',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const user = await UserService.updateProfile(
      (req as any).user.id,
      value as UpdateProfileRequest
    );

    const response: ApiResponse = {
      success: true,
      message: 'Profile updated successfully',
      data: { user },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   DELETE /api/users/profile
 * @desc    Deactivate user account
 * @access  Private
 */
router.delete(
  '/profile',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    await UserService.deactivateAccount((req as any).user.id);

    const response: ApiResponse = {
      success: true,
      message: 'Account deactivated successfully',
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

export default router;
