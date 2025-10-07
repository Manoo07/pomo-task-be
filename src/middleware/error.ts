import { ApiResponse } from '@/types';
import { NextFunction, Request, Response } from 'express';

export class ErrorMiddleware {
  /**
   * Global error handler
   */
  static handleError(error: Error, req: Request, res: Response): void {
    let statusCode = 500;
    let message = 'Internal server error';
    let isOperational = false;

    if (error instanceof AppError) {
      statusCode = error.statusCode;
      message = error.message;
      isOperational = error.isOperational;
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
      message = error.message;
      isOperational = true;
    } else if (error.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token';
      isOperational = true;
    } else if (error.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token expired';
      isOperational = true;
    }

    // Log error
    console.error(`[${new Date().toISOString()}] Error:`, {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const response: ApiResponse = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    // Include error details in development
    if (process.env['NODE_ENV'] === 'development' && !isOperational) {
      response.error = error.stack || 'No stack trace available';
    }

    res.status(statusCode).json(response);
  }

  /**
   * Handle 404 errors
   */
  static handleNotFound(req: Request, res: Response): void {
    const response: ApiResponse = {
      success: false,
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
    };

    res.status(404).json(response);
  }

  /**
   * Async error wrapper
   */
  static asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

/**
 * Custom error class
 */
export class AppError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}
