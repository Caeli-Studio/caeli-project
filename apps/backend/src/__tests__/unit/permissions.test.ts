import { FastifyRequest, FastifyReply } from 'fastify';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createMockSupabaseClient } from '../../__mocks__/supabase';
import {
  loadMembership,
  requirePermission,
  requireRole,
} from '../../middleware/permissions';

describe('Permissions Middleware - Unit Tests', () => {
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
      params: {},
      membership: undefined,
      groupId: undefined,
    };
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  describe('loadMembership', () => {
    it('should load membership successfully', async () => {
      const mockMembership = {
        id: 'mem-1',
        group_id: 'group-1',
        user_id: 'user-123',
        role: 'member',
        left_at: null,
      };

      mockRequest.params = { group_id: 'group-1' };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: mockMembership, error: null }),
      } as any);

      await loadMembership(mockRequest as any, mockReply as FastifyReply);

      expect(mockRequest.membership).toEqual(mockMembership);
      expect(mockRequest.groupId).toBe('group-1');
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('should return 400 when group_id is missing', async () => {
      mockRequest.params = {};

      await loadMembership(mockRequest as any, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Group ID is required',
      });
    });

    it('should return 403 when user is not a member', async () => {
      mockRequest.params = { group_id: 'group-1' };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      } as any);

      await loadMembership(mockRequest as any, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'You are not a member of this group',
      });
    });
  });

  describe('requirePermission', () => {
    it('should allow access when user has permission', async () => {
      mockRequest.membership = {
        id: 'mem-1',
        group_id: 'group-1',
        user_id: 'user-123',
        role_name: 'owner',
        custom_permissions: null,
        left_at: null,
      } as any;

      const middleware = requirePermission('can_edit_group');
      await middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('should return 403 when membership not loaded', async () => {
      mockRequest.membership = undefined;

      const middleware = requirePermission('can_edit_group');
      await middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Membership not loaded',
        message: 'loadMembership middleware must be called first',
      });
    });

    it('should return 403 when user lacks permission', async () => {
      mockRequest.membership = {
        id: 'mem-1',
        group_id: 'group-1',
        user_id: 'user-123',
        role_name: 'member', // member doesn't have can_edit_group permission
        custom_permissions: null,
        left_at: null,
      } as any;

      const middleware = requirePermission('can_edit_group');
      await middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Insufficient permissions',
          required_permission: 'can_edit_group',
        })
      );
    });
  });

  describe('requireRole', () => {
    it('should allow access when user has allowed role', async () => {
      mockRequest.membership = {
        id: 'mem-1',
        role_name: 'owner',
      } as any;

      const middleware = requireRole('owner', 'admin');
      await middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('should return 403 when membership not loaded', async () => {
      mockRequest.membership = undefined;

      const middleware = requireRole('owner');
      await middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Membership not loaded',
      });
    });

    it('should return 403 when user has wrong role', async () => {
      mockRequest.membership = {
        id: 'mem-1',
        role_name: 'member',
      } as any;

      const middleware = requireRole('owner', 'admin');
      await middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient role',
        message: `You need one of these roles: owner, admin`,
        required_roles: ['owner', 'admin'],
        your_role: 'member',
      });
    });
  });

  describe('loadMembership - additional tests', () => {
    it('should handle database error gracefully', async () => {
      mockRequest.params = { group_id: 'group-1' };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      } as any);

      await loadMembership(mockRequest as any, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requirePermission - additional tests', () => {
    it('should allow access for admin with can_manage_members', async () => {
      mockRequest.membership = {
        id: 'mem-1',
        role_name: 'admin',
        custom_permissions: null,
      } as any;

      const middleware = requirePermission('can_manage_members');
      await middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('should deny member trying to delete tasks', async () => {
      mockRequest.membership = {
        id: 'mem-1',
        role_name: 'member',
        custom_permissions: null,
      } as any;

      const middleware = requirePermission('can_delete_tasks');
      await middleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(403);
    });
  });
});
