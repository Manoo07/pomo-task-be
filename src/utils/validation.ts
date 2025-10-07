import { ValidationError } from '@/types';
import Joi from 'joi';

export class ValidationUtils {
  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailSchema = Joi.string().email().required();
    const { error } = emailSchema.validate(email);
    return !error;
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate username format
   */
  static validateUsername(username: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    
    if (username.length > 20) {
      errors.push('Username must be no more than 20 characters long');
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize input string
   */
  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(page?: string, limit?: string): { page: number; limit: number } {
    const pageNum = Math.max(1, parseInt(page || '1') || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '10') || 10));
    
    return { page: pageNum, limit: limitNum };
  }

  /**
   * Validate date range
   */
  static validateDateRange(startDate?: string, endDate?: string): { start: Date; end: Date } {
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();
    
    if (isNaN(start.getTime())) {
      throw new Error('Invalid start date format');
    }
    
    if (isNaN(end.getTime())) {
      throw new Error('Invalid end date format');
    }
    
    if (start > end) {
      throw new Error('Start date must be before end date');
    }
    
    return { start, end };
  }

  /**
   * Format validation errors
   */
  static formatValidationErrors(errors: Joi.ValidationError): ValidationError[] {
    return errors.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
  }
}
