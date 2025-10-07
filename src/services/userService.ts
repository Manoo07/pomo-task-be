import { AppError } from '@/middleware/error';
import prisma from '@/prismaClient';
import { LoginRequest, RegisterRequest, UpdateProfileRequest } from '@/types';
import { AuthUtils } from '@/utils/auth';
import { ValidationUtils } from '@/utils/validation';
import { User } from '@prisma/client';

export class UserService {
  /**
   * Register a new user
   */
  static async register(data: RegisterRequest): Promise<{
    user: Omit<User, 'password'>;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    // Validate email
    if (!ValidationUtils.validateEmail(data.email)) {
      throw new AppError('Invalid email format', 400);
    }

    // Validate password
    const passwordValidation = ValidationUtils.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      throw new AppError(
        `Password validation failed: ${passwordValidation.errors.join(', ')}`,
        400
      );
    }

    // Validate username
    const usernameValidation = ValidationUtils.validateUsername(data.username);
    if (!usernameValidation.isValid) {
      throw new AppError(
        `Username validation failed: ${usernameValidation.errors.join(', ')}`,
        400
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      throw new AppError(
        'User with this email or username already exists',
        409
      );
    }

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
      },
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

    // Create default user settings
    await prisma.userSettings.create({
      data: {
        userId: user.id,
      },
    });

    // Generate tokens
    const tokens = {
      accessToken: AuthUtils.generateAccessToken({
        userId: user.id,
        email: user.email,
      }),
      refreshToken: AuthUtils.generateRefreshToken({
        userId: user.id,
        email: user.email,
      }),
    };

    return { user, tokens };
  }

  /**
   * Login user
   */
  static async login(data: LoginRequest): Promise<{
    user: Omit<User, 'password'>;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await AuthUtils.comparePassword(
      data.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const tokens = {
      accessToken: AuthUtils.generateAccessToken({
        userId: user.id,
        email: user.email,
      }),
      refreshToken: AuthUtils.generateRefreshToken({
        userId: user.id,
        email: user.email,
      }),
    };

    // Return user without password
    const { password: _password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  /**
   * Refresh access token
   */
  static async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = AuthUtils.verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    // Generate new tokens
    return {
      accessToken: AuthUtils.generateAccessToken({
        userId: user.id,
        email: user.email,
      }),
      refreshToken: AuthUtils.generateRefreshToken({
        userId: user.id,
        email: user.email,
      }),
    };
  }

  /**
   * Get user profile
   */
  static async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    data: UpdateProfileRequest
  ): Promise<Omit<User, 'password'>> {
    const updateData: Partial<User> = {};

    if (data.firstName !== undefined) {
      updateData.firstName = ValidationUtils.sanitizeString(data.firstName);
    }
    if (data.lastName !== undefined) {
      updateData.lastName = ValidationUtils.sanitizeString(data.lastName);
    }
    if (data.avatar !== undefined) {
      updateData.avatar = data.avatar;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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

    return user;
  }

  /**
   * Deactivate user account
   */
  static async deactivateAccount(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  /**
   * Check if email exists
   */
  static async emailExists(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!user;
  }

  /**
   * Check if username exists
   */
  static async usernameExists(username: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    return !!user;
  }
}
