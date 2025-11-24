import { FastifyRequest, FastifyReply } from 'fastify';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createMockSupabaseClient } from '../../__mocks__/supabase';
import {
  updateMyProfile,
  createProfile,
} from '../../controllers/profile.controller';

describe('Profile Controller - Simple Tests', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabaseClient = createMockSupabaseClient();
    mockRequest = {
      jwtVerify: vi.fn().mockResolvedValue(undefined),
      user: { sub: 'user-123' } as any,
      supabaseClient: mockSupabaseClient as any,
      log: {
        error: vi.fn(),
      } as any,
      body: {},
    };
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  describe('updateMyProfile', () => {
    it('should reject invalid pseudo format', async () => {
      mockRequest.body = {
        pseudo: 'ab', // Too short
      };

      await updateMyProfile(mockRequest as any, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid pseudo format',
        message: 'Pseudo must be 3-20 alphanumeric characters or underscores',
      });
    });
  });

  describe('createProfile', () => {
    it('should reject invalid pseudo format', async () => {
      mockRequest.body = {
        display_name: 'Test User',
        pseudo: 'invalid-pseudo!',
        locale: 'en',
      };

      // Mock existing profile check - no existing profile
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      } as any);

      await createProfile(mockRequest as any, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid pseudo format',
        message: 'Pseudo must be 3-20 alphanumeric characters or underscores',
      });
    });

    it('should handle profile creation with valid data', async () => {
      mockRequest.body = {
        display_name: 'Test User',
        pseudo: 'testuser123',
        locale: 'en',
      };

      // Mock existing profile check - no existing profile
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      } as any);

      // Mock successful insert
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { user_id: 'user-123', display_name: 'Test User' },
          error: null,
        }),
      } as any);

      await createProfile(mockRequest as any, mockReply as FastifyReply);

      expect(mockReply.send).toHaveBeenCalled();
    });
  });
});
