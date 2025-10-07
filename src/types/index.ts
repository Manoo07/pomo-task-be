import { User } from '@prisma/client';
import { Request } from 'express';

// Extended Request interface with user
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// JWT Payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User related interfaces
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

// Task related interfaces
export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedPomodoros?: number;
  trackId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedPomodoros?: number;
  completedPomodoros?: number;
  trackId?: string;
}

// Learning Track interfaces
export interface CreateTrackRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateTrackRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

// Session interfaces
export interface StartSessionRequest {
  type: 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK';
  taskId?: string;
}

export interface CompleteSessionRequest {
  duration?: number; // Override duration if needed
}

// Settings interfaces
export interface UpdateSettingsRequest {
  pomodoroDuration?: number;
  shortBreakDuration?: number;
  longBreakDuration?: number;
  longBreakInterval?: number;
  autoStartBreaks?: boolean;
  autoStartPomodoros?: boolean;
  soundEnabled?: boolean;
  desktopNotifications?: boolean;
  emailNotifications?: boolean;
  theme?: string;
  language?: string;
}

// Analytics interfaces
export interface AnalyticsQuery {
  period: 'daily' | 'weekly' | 'monthly';
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsData {
  totalPomodoros: number;
  totalFocusTime: number;
  totalBreakTime: number;
  completedTasks: number;
  streak: number;
  productivityScore: number;
  period: string;
  data: Array<{
    date: string;
    pomodoros: number;
    focusTime: number;
    breakTime: number;
    completedTasks: number;
    productivityScore: number;
  }>;
}

// WebSocket message interfaces
export interface WebSocketMessage {
  type: 'SESSION_START' | 'SESSION_END' | 'SESSION_PAUSE' | 'SESSION_RESUME' | 'TIMER_SYNC';
  userId: string;
  data: any;
  timestamp: string;
}

// Error interfaces
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
