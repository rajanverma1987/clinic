/**
 * Unit tests for authentication service
 * Tests user registration, login, and token management
 */

import { registerUser, loginUser, refreshAccessToken } from '../auth.service';
import User from '@/models/User';
import Tenant from '@/models/Tenant';
import Subscription from '@/models/Subscription';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import { connectDB } from '@/lib/db/connection';
import * as jwt from '@/lib/auth/jwt';

// Mock dependencies
jest.mock('@/lib/db/connection');
jest.mock('@/models/User');
jest.mock('@/models/Tenant');
jest.mock('@/models/Subscription');
jest.mock('@/models/SubscriptionPlan');
jest.mock('@/lib/auth/jwt');
jest.mock('@/lib/audit/audit-logger', () => ({
  AuditLogger: {
    log: jest.fn(),
  },
  AuditAction: {
    USER_REGISTERED: 'USER_REGISTERED',
    USER_LOGGED_IN: 'USER_LOGGED_IN',
  },
}));

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new clinic admin and create tenant', async () => {
      const input = {
        email: 'test@clinic.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        clinicName: 'Test Clinic',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        phone: '1234567890',
      };

      // Mock database connection
      connectDB.mockResolvedValue();

      // Mock User.findOne (checking for existing user)
      User.findOne.mockResolvedValue(null);

      // Mock Tenant.findOne (checking for existing slug)
      Tenant.findOne.mockResolvedValue(null);

      // Mock SubscriptionPlan.findOne (free plan)
      SubscriptionPlan.findOne.mockResolvedValue({
        _id: 'plan-id',
        name: 'Free Plan',
        price: 0,
      });

      // Mock Tenant.create
      const mockTenant = {
        _id: 'tenant-id',
        name: 'Test Clinic',
        slug: 'test-clinic',
      };
      Tenant.create.mockResolvedValue(mockTenant);

      // Mock Subscription.create
      Subscription.create.mockResolvedValue({
        _id: 'sub-id',
        tenantId: 'tenant-id',
      });

      // Mock User.create
      const mockUser = {
        _id: 'user-id',
        email: 'test@clinic.com',
        role: 'clinic_admin',
        tenantId: 'tenant-id',
        toObject: () => ({
          _id: 'user-id',
          email: 'test@clinic.com',
          role: 'clinic_admin',
        }),
      };
      User.create.mockResolvedValue(mockUser);

      const result = await registerUser(input);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tenant');
      expect(result.user.email).toBe('test@clinic.com');
      expect(result.tenant.name).toBe('Test Clinic');
      expect(User.create).toHaveBeenCalled();
      expect(Tenant.create).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      const input = {
        email: 'existing@clinic.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        clinicName: 'Test Clinic',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        phone: '1234567890',
      };

      connectDB.mockResolvedValue();
      User.findOne.mockResolvedValue({ email: 'existing@clinic.com' });

      await expect(registerUser(input)).rejects.toThrow('User with this email already exists');
    });

    it('should throw error if clinic name is missing', async () => {
      const input = {
        email: 'test@clinic.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        // clinicName missing
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        phone: '1234567890',
      };

      connectDB.mockResolvedValue();
      User.findOne.mockResolvedValue(null);

      await expect(registerUser(input)).rejects.toThrow('Clinic name is required');
    });
  });

  describe('loginUser', () => {
    it('should login user with valid credentials', async () => {
      const input = {
        email: 'test@clinic.com',
        password: 'Password123!',
      };

      connectDB.mockResolvedValue();

      const mockUser = {
        _id: 'user-id',
        email: 'test@clinic.com',
        password: 'hashed-password',
        role: 'clinic_admin',
        tenantId: 'tenant-id',
        status: 'active',
        comparePassword: jest.fn().mockResolvedValue(true),
        toObject: () => ({
          _id: 'user-id',
          email: 'test@clinic.com',
          role: 'clinic_admin',
        }),
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.generateAccessToken.mockReturnValue('access-token');
      jwt.generateRefreshToken.mockReturnValue('refresh-token');

      const result = await loginUser(input, '127.0.0.1', 'Mozilla/5.0');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.accessToken).toBe('access-token');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('Password123!');
    });

    it('should throw error for invalid email', async () => {
      const input = {
        email: 'nonexistent@clinic.com',
        password: 'Password123!',
      };

      connectDB.mockResolvedValue();
      User.findOne.mockResolvedValue(null);

      await expect(loginUser(input, '127.0.0.1', 'Mozilla/5.0')).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      const input = {
        email: 'test@clinic.com',
        password: 'WrongPassword!',
      };

      connectDB.mockResolvedValue();

      const mockUser = {
        _id: 'user-id',
        email: 'test@clinic.com',
        password: 'hashed-password',
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      User.findOne.mockResolvedValue(mockUser);

      await expect(loginUser(input, '127.0.0.1', 'Mozilla/5.0')).rejects.toThrow('Invalid email or password');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';

      connectDB.mockResolvedValue();
      jwt.verifyRefreshToken.mockReturnValue({
        userId: 'user-id',
        tenantId: 'tenant-id',
      });

      const mockUser = {
        _id: 'user-id',
        email: 'test@clinic.com',
        status: 'active',
        toObject: () => ({
          _id: 'user-id',
          email: 'test@clinic.com',
        }),
      };

      User.findById.mockResolvedValue(mockUser);
      jwt.generateAccessToken.mockReturnValue('new-access-token');

      const result = await refreshAccessToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toBe('new-access-token');
    });

    it('should throw error for invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token';

      connectDB.mockResolvedValue();
      jwt.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });

      await expect(refreshAccessToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });
  });
});
