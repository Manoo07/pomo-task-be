import { setupSwagger } from '@/config/swagger';
import { SecurityMiddleware } from '@/middleware/security';
import analyticsRoutes from '@/routes/analytics';
import authRoutes from '@/routes/auth';
import sessionRoutes from '@/routes/sessions';
import settingsRoutes from '@/routes/settings';
import taskRoutes from '@/routes/tasks';
import trackRoutes from '@/routes/tracks';
import userRoutes from '@/routes/users';
import dotenv from 'dotenv';
import express from 'express';

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(SecurityMiddleware.helmet());
app.use(SecurityMiddleware.cors());
app.use(SecurityMiddleware.compression());
app.use(SecurityMiddleware.requestLogger);
app.use(SecurityMiddleware.validateRequestSize());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(SecurityMiddleware.rateLimit());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'] || 'development',
  });
});

// Setup Swagger documentation
setupSwagger(app);

// API routes
app.use('/api/auth', SecurityMiddleware.authRateLimit(), authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Pomofocus Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    documentation: '/api/docs',
  });
});

export default app;
