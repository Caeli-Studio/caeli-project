import { FastifyRequest, FastifyReply } from 'fastify';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createMockSupabaseClient } from '../../__mocks__/supabase';
import {
  getNotifications,
  deleteNotification,
} from '../../controllers/notification.controller';

describe('Notification Controller - Simple Tests', () => {
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
      query: {},
      params: {},
    };
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  describe('getNotifications', () => {
    it('should return empty array when user has no memberships', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      await getNotifications(mockRequest as any, mockReply as FastifyReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        notifications: [],
        total: 0,
      });
    });
  });

  describe('deleteNotification', () => {
    it('should return 404 when notification not found', async () => {
      mockRequest.params = { notification_id: 'notif-999' };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      await deleteNotification(mockRequest as any, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Notification not found',
      });
    });

    it("should return 403 when user tries to delete someone else's notification", async () => {
      const mockNotification = {
        id: 'notif-1',
        membership: { user_id: 'other-user' },
      };
      mockRequest.params = { notification_id: 'notif-1' };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: mockNotification, error: null }),
      } as any);

      await deleteNotification(mockRequest as any, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Not your notification',
      });
    });

    it('should delete notification successfully', async () => {
      const mockNotification = {
        id: 'notif-1',
        membership: { user_id: 'user-123' },
      };
      mockRequest.params = { notification_id: 'notif-1' };

      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: mockNotification, error: null }),
      } as any);

      mockSupabaseClient.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      await deleteNotification(mockRequest as any, mockReply as FastifyReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: 'Notification deleted',
      });
    });
  });
});
