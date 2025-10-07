import prisma from '@/prismaClient';
import { AuthenticatedRequest } from '@/types';
import { AuthUtils } from '@/utils/auth';
import { NextFunction, Response } from 'express';

export class AuthMiddleware {
  /**
   * Authenticate user using JWT token
   */
  static async authenticate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = AuthUtils.extractTokenFromHeader(req.headers.authorization);

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Access token is required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const payload = AuthUtils.verifyAccessToken(token);

      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'User not found or inactive',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      req.user = user as any;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Authentication failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Optional authentication - doesn't fail if no token provided
   */
  static async optionalAuth(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = AuthUtils.extractTokenFromHeader(req.headers.authorization);

      if (token) {
        const payload = AuthUtils.verifyAccessToken(token);
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (user && user.isActive) {
          req.user = user as any;
        }
      }

      next();
    } catch (error) {
      // Continue without authentication for optional auth
      next();
    }
  }

  /**
   * Check if user owns resource
   */
  static checkOwnership(userIdField: string = 'userId') {
    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const resourceUserId = req.params[userIdField] || req.body[userIdField];

      if (resourceUserId && resourceUserId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'Access denied - insufficient permissions',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      next();
    };
  }
}
