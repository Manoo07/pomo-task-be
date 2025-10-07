import compression from 'compression';
import cors from 'cors';
import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

export class SecurityMiddleware {
  /**
   * Configure CORS
   */
  static cors() {
    const isDevelopment = process.env['NODE_ENV'] === 'development';

    // Get CORS origins from environment variable
    const corsOrigins = process.env['CORS_ORIGIN']
      ? process.env['CORS_ORIGIN'].split(',').map(origin => origin.trim())
      : [];

    return cors({
      origin: isDevelopment
        ? true // Allow all origins in development
        : corsOrigins.length > 0
          ? corsOrigins
          : false, // Block all origins in production if not configured
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers',
      ],
      exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
      ],
      optionsSuccessStatus: 200, // Some legacy browsers choke on 204
    });
  }

  /**
   * Security headers
   */
  static helmet() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    });
  }

  /**
   * Rate limiting
   */
  static rateLimit() {
    const windowMs = parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'); // 15 minutes
    const max = parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100');

    return rateLimit({
      windowMs,
      max,
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later',
        timestamp: new Date().toISOString(),
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  /**
   * Auth rate limiting (stricter for auth endpoints)
   */
  static authRateLimit() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: {
        success: false,
        message: 'Too many authentication attempts, please try again later',
        timestamp: new Date().toISOString(),
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  /**
   * Compression middleware
   */
  static compression() {
    return compression({
      level: 6,
      threshold: 1024, // Only compress responses larger than 1KB
    });
  }

  /**
   * Request logging
   */
  static requestLogger(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${req.ip}`
      );
    });

    next();
  }

  /**
   * Validate request size
   */
  static validateRequestSize(maxSize: number = 1024 * 1024) {
    // 1MB default
    return (req: Request, res: Response, next: NextFunction): void => {
      const contentLength = parseInt(req.get('content-length') || '0');

      if (contentLength > maxSize) {
        res.status(413).json({
          success: false,
          message: 'Request entity too large',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      next();
    };
  }
}
