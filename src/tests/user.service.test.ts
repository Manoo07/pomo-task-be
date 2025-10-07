import { UserService } from '@/services/userService';
import { LoginRequest, RegisterRequest } from '@/types';

describe('UserService', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData: RegisterRequest = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const result = await UserService.register(userData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.username).toBe(userData.username);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw error for invalid email', async () => {
      const userData: RegisterRequest = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'Password123!',
      };

      await expect(UserService.register(userData)).rejects.toThrow(
        'Invalid email format'
      );
    });

    it('should throw error for weak password', async () => {
      const userData: RegisterRequest = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'weak',
      };

      await expect(UserService.register(userData)).rejects.toThrow(
        'Password validation failed'
      );
    });

    it('should throw error for duplicate email', async () => {
      const userData: RegisterRequest = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
      };

      // Register first user
      await UserService.register(userData);

      // Try to register with same email
      const duplicateData = { ...userData, username: 'differentuser' };
      await expect(UserService.register(duplicateData)).rejects.toThrow(
        'User with this email or username already exists'
      );
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create a test user
      const userData: RegisterRequest = {
        email: 'login@example.com',
        username: 'loginuser',
        password: 'Password123!',
      };
      await UserService.register(userData);
    });

    it('should login user with valid credentials', async () => {
      const loginData: LoginRequest = {
        email: 'login@example.com',
        password: 'Password123!',
      };

      const result = await UserService.login(loginData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(loginData.email);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw error for invalid credentials', async () => {
      const loginData: LoginRequest = {
        email: 'login@example.com',
        password: 'wrongpassword',
      };

      await expect(UserService.login(loginData)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw error for non-existent user', async () => {
      const loginData: LoginRequest = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      await expect(UserService.login(loginData)).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('getProfile', () => {
    let userId: string;

    beforeEach(async () => {
      const userData: RegisterRequest = {
        email: 'profile@example.com',
        username: 'profileuser',
        password: 'Password123!',
      };
      const result = await UserService.register(userData);
      userId = result.user.id;
    });

    it('should get user profile successfully', async () => {
      const profile = await UserService.getProfile(userId);

      expect(profile).toBeDefined();
      expect(profile.id).toBe(userId);
      expect(profile.email).toBe('profile@example.com');
    });

    it('should throw error for non-existent user', async () => {
      await expect(UserService.getProfile('non-existent-id')).rejects.toThrow(
        'User not found'
      );
    });
  });
});
