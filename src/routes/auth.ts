import { AuthMiddleware, ErrorMiddleware } from '@/middleware';
import { UserService } from '@/services/userService';
import { ApiResponse, LoginRequest, RegisterRequest } from '@/types';
import { Request, Response, Router } from 'express';
import Joi from 'joi';

const router = Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(20).required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email, username, and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             email: "user@example.com"
 *             username: "johndoe"
 *             password: "password123"
 *             firstName: "John"
 *             lastName: "Doe"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               message: "User registered successfully"
 *               data:
 *                 user:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   email: "user@example.com"
 *                   username: "johndoe"
 *                   firstName: "John"
 *                   lastName: "Doe"
 *                   isActive: true
 *                   createdAt: "2023-01-01T00:00:00.000Z"
 *                   updatedAt: "2023-01-01T00:00:00.000Z"
 *                 tokens:
 *                   accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               timestamp: "2023-01-01T00:00:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Validation error"
 *               error: "Email is required"
 *               timestamp: "2023-01-01T00:00:00.000Z"
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "User with this email or username already exists"
 *               timestamp: "2023-01-01T00:00:00.000Z"
 */
router.post(
  '/register',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = registerSchema.validate(req.body);

    if (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation error',
        error: error.details[0]?.message || 'Validation failed',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const result = await UserService.register(value as RegisterRequest);

    const response: ApiResponse = {
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        tokens: result.tokens,
      },
      timestamp: new Date().toISOString(),
    };

    return res.status(201).json(response);
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation error',
        error: error.details[0]?.message || 'Validation failed',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const result = await UserService.login(value as LoginRequest);

    const response: ApiResponse = {
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        tokens: result.tokens,
      },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = refreshTokenSchema.validate(req.body);

    if (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation error',
        error: error.details[0]?.message || 'Validation failed',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const tokens = await UserService.refreshToken(value.refreshToken);

    const response: ApiResponse = {
      success: true,
      message: 'Token refreshed successfully',
      data: { tokens },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client should discard tokens)
 * @access  Private
 */
router.post(
  '/logout',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (_req: Request, res: Response) => {
    const response: ApiResponse = {
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  AuthMiddleware.authenticate,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const user = await UserService.getProfile((req as any).user.id);

    const response: ApiResponse = {
      success: true,
      message: 'User profile retrieved successfully',
      data: { user },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   GET /api/auth/check-email/:email
 * @desc    Check if email exists
 * @access  Public
 */
router.get(
  '/check-email/:email',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.params;

    if (!email) {
      const response: ApiResponse = {
        success: false,
        message: 'Email parameter is required',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const exists = await UserService.emailExists(email);

    const response: ApiResponse = {
      success: true,
      message: 'Email check completed',
      data: { exists },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

/**
 * @route   GET /api/auth/check-username/:username
 * @desc    Check if username exists
 * @access  Public
 */
router.get(
  '/check-username/:username',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.params;

    if (!username) {
      const response: ApiResponse = {
        success: false,
        message: 'Username parameter is required',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const exists = await UserService.usernameExists(username);

    const response: ApiResponse = {
      success: true,
      message: 'Username check completed',
      data: { exists },
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  })
);

export default router;
