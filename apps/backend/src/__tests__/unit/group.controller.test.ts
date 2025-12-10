import { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

import { createMockSupabaseClient } from '../../__mocks__/supabase';
import { createTestApp, closeTestApp } from '../helpers/test-app';

describe('Group Controller - Unit Tests', () => {
  let app: FastifyInstance;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  const mockUserId = 'test-user-id';
  const mockGroupId = 'test-group-id';

  beforeAll(async () => {
    app = await createTestApp();
    mockSupabase = createMockSupabaseClient();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('POST /api/groups', () => {
    it('should create a household successfully', async () => {
      const mockGroup = {
        id: mockGroupId,
        name: 'Test Family',
        type: 'family',
        created_at: new Date().toISOString(),
      };

      const mockMembership = {
        id: 'membership-id',
        group_id: mockGroupId,
        user_id: mockUserId,
        role_name: 'owner',
        importance: 100,
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockGroup, error: null })
        .mockResolvedValueOnce({ data: mockMembership, error: null });

      const mockRequest = {
        jwtVerify: vi.fn().mockResolvedValue(undefined),
        user: { sub: mockUserId },
        supabaseClient: mockSupabase,
        supabaseServiceClient: mockSupabase,
        body: {
          name: 'Test Family',
          type: 'family',
        },
        log: { error: vi.fn() },
      };

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };

      const { createGroup } = await import(
        '../../controllers/group.controller'
      );
      await createGroup(mockRequest as any, mockReply as any);

      expect(mockReply.status).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: {
          group: mockGroup,
          membership: mockMembership,
        },
        message: 'Foyer créé avec succès',
      });
    });

    it('should handle missing user ID', async () => {
      const mockRequest = {
        jwtVerify: vi.fn().mockResolvedValue(undefined),
        user: {},
        body: {
          name: 'Test Family',
        },
        log: { error: vi.fn() },
      };

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };

      const { createGroup } = await import(
        '../../controllers/group.controller'
      );
      await createGroup(mockRequest as any, mockReply as any);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'User ID not found in token',
      });
    });

    it('should rollback group creation if membership fails', async () => {
      const mockGroup = {
        id: mockGroupId,
        name: 'Test Family',
        type: 'family',
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.delete = vi.fn().mockReturnValue(mockSupabase);
      mockSupabase.eq.mockResolvedValueOnce({ data: null, error: null } as any);
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockGroup, error: null })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Membership creation failed' },
        });

      const mockRequest = {
        jwtVerify: vi.fn().mockResolvedValue(undefined),
        user: { sub: mockUserId },
        supabaseClient: mockSupabase,
        supabaseServiceClient: mockSupabase,
        body: {
          name: 'Test Family',
        },
        log: { error: vi.fn() },
      };

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };

      const { createGroup } = await import(
        '../../controllers/group.controller'
      );
      await createGroup(mockRequest as any, mockReply as any);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockSupabase.delete).toHaveBeenCalled();
    });

    it('should handle group creation failure', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const mockRequest = {
        jwtVerify: vi.fn().mockResolvedValue(undefined),
        user: { sub: mockUserId },
        supabaseClient: mockSupabase,
        supabaseServiceClient: mockSupabase,
        body: {
          name: 'Test Family',
        },
        log: { error: vi.fn() },
      };

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };

      const { createGroup } = await import(
        '../../controllers/group.controller'
      );
      await createGroup(mockRequest as any, mockReply as any);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to create group',
        })
      );
    });
  });

  describe('GET /api/groups', () => {
    it('should retrieve user groups successfully', async () => {
      const memberships = [
        {
          id: 'm-1',
          group_id: 'group-1',
          user_id: mockUserId,
          role_name: 'owner',
          importance: 100,
        },
        {
          id: 'm-2',
          group_id: 'group-2',
          user_id: mockUserId,
          role_name: 'member',
          importance: 10,
        },
      ];

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      // First query returns memberships (chain ends with .is)
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.is.mockResolvedValueOnce({
        data: memberships,
        error: null,
      } as any);

      // Then controller fetches groups by ids
      const groups = [
        { id: 'group-1', name: 'Family 1', type: 'family' },
        { id: 'group-2', name: 'Family 2', type: 'family' },
      ];
      mockSupabase.in.mockResolvedValueOnce({
        data: groups,
        error: null,
      } as any);

      const mockRequest = {
        jwtVerify: vi.fn().mockResolvedValue(undefined),
        user: { sub: mockUserId },
        supabaseClient: mockSupabase,
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { getMyGroups } = await import(
        '../../controllers/group.controller'
      );
      await getMyGroups(mockRequest as any, mockReply as any);

      const groupsData = memberships.map((membership) => ({
        group: groups.find((g) => g.id === membership.group_id) || null,
        membership: {
          id: membership.id,
          group_id: membership.group_id,
          user_id: membership.user_id,
          role_name: membership.role_name,
          importance: membership.importance,
        },
      }));

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: groupsData,
      });
    });

    it('should handle authentication failure', async () => {
      const mockRequest = {
        jwtVerify: vi.fn().mockRejectedValue(new Error('Invalid token')),
        log: { error: vi.fn() },
      };

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };

      const { getMyGroups } = await import(
        '../../controllers/group.controller'
      );
      await getMyGroups(mockRequest as any, mockReply as any);

      // jwtVerify can throw (500) or return 401 depending on implementation
      expect([401, 500]).toContain(mockReply.status.mock.calls[0][0]);
    });
  });

  describe('GET /api/groups/:group_id', () => {
    it('should retrieve group details successfully', async () => {
      const mockGroup = {
        id: mockGroupId,
        name: 'Test Family',
        type: 'family',
        created_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockGroup,
        error: null,
      });

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { getGroup } = await import('../../controllers/group.controller');
      await getGroup(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          group: expect.objectContaining({
            id: mockGroupId,
            name: 'Test Family',
            type: 'family',
          }),
        })
      );
    });

    it('should handle group not found', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Group not found' },
      });

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: 'non-existent-id' },
        log: { error: vi.fn() },
      };

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };

      const { getGroup } = await import('../../controllers/group.controller');
      await getGroup(mockRequest as any, mockReply as any);

      expect(mockReply.status).toHaveBeenCalledWith(404);
    });
  });

  describe('PUT /api/groups/:group_id', () => {
    it('should update group successfully', async () => {
      const updatedGroup = {
        id: mockGroupId,
        name: 'Updated Family Name',
        type: 'family',
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: updatedGroup,
        error: null,
      });

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId },
        body: {
          name: 'Updated Family Name',
        },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { updateGroup } = await import(
        '../../controllers/group.controller'
      );
      await updateGroup(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        group: updatedGroup,
      });
    });
  });

  describe('DELETE /api/groups/:group_id', () => {
    it('should delete group successfully', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.delete.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockResolvedValueOnce({ error: null } as any);

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { deleteGroup } = await import(
        '../../controllers/group.controller'
      );
      await deleteGroup(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: 'Group deleted successfully',
      });
    });
  });
});
//
