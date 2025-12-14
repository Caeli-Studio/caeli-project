import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockSupabaseClient } from '../../__mocks__/supabase';

describe('Membership Controller - Unit Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  const mockGroupId = 'test-group-id';
  const mockMemberId = 'test-member-id';
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  describe('GET /api/groups/:group_id/members', () => {
    it('should fetch all members of a group successfully', async () => {
      const members = [
        {
          id: mockMemberId,
          group_id: mockGroupId,
          user_id: mockUserId,
          role: 'owner',
          importance: 100,
          profile: { id: mockUserId, display_name: 'Test User' },
          preferences: {},
        },
      ];

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.is.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValueOnce({
        data: members,
        error: null,
      } as any);

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { getMembers } = await import(
        '../../controllers/membership.controller'
      );
      await getMembers(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        members,
        total: 1,
      });
    });
  });

  describe('GET /api/groups/:group_id/members/:member_id', () => {
    it('should fetch a specific member successfully', async () => {
      const member = {
        id: mockMemberId,
        group_id: mockGroupId,
        user_id: mockUserId,
        role: 'member',
        profile: { id: mockUserId, display_name: 'Test User' },
        group: { id: mockGroupId, name: 'Test Group' },
        preferences: {},
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.is.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: member,
        error: null,
      } as any);

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId, member_id: mockMemberId },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { getMember } = await import(
        '../../controllers/membership.controller'
      );
      await getMember(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        member,
      });
    });

    it('should return 404 when member not found', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.is.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      } as any);

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId, member_id: 'nonexistent' },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { getMember } = await import(
        '../../controllers/membership.controller'
      );
      await getMember(mockRequest as any, mockReply as any);

      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Member not found',
      });
    });
  });

  describe('PUT /api/groups/:group_id/members/:membership_id', () => {
    it('should update member role successfully', async () => {
      const updatedMember = {
        id: mockMemberId,
        group_id: mockGroupId,
        user_id: mockUserId,
        role: 'admin',
        importance: 80,
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: updatedMember,
        error: null,
      } as any);

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId, membership_id: mockMemberId },
        body: { role: 'admin' },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { updateMember } = await import(
        '../../controllers/membership.controller'
      );
      await updateMember(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          member: updatedMember,
        })
      );
    });
  });

  describe('DELETE /api/groups/:group_id/members/:membership_id', () => {
    it('should remove member successfully', async () => {
      // Mock member lookup (get role_name)
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: { role_name: 'member' },
        error: null,
      } as any);

      // Mock member lookup (get user_id)
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: { user_id: mockUserId },
        error: null,
      } as any);

      // Mock update
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.update.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockResolvedValueOnce({
        data: { id: mockMemberId },
        error: null,
      } as any);

      // Mock profile lookup (get pseudo)
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: { pseudo: 'testpseudo' },
        error: null,
      } as any);

      // Mock invitation delete
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.delete.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.is.mockResolvedValueOnce({
        data: null,
        error: null,
      } as any);

      const mockRequest = {
        supabaseClient: mockSupabase,
        membership: { id: 'different-member-id' },
        params: { group_id: mockGroupId, membership_id: mockMemberId },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { removeMember } = await import(
        '../../controllers/membership.controller'
      );
      await removeMember(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: 'Member removed successfully',
      });
    });
  });

  describe('POST /api/groups/:group_id/members/invite', () => {
    it('should invite member by email successfully', async () => {
      const newMembership = {
        id: mockMemberId,
        group_id: mockGroupId,
        user_id: mockUserId,
        role: 'member',
      };

      // Mock user lookup
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: { user_id: mockUserId },
        error: null,
      } as any);

      // Mock existing membership check
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      } as any);

      // Mock membership creation
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.insert.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: newMembership,
        error: null,
      } as any);

      // Mock notification insert
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.insert.mockResolvedValueOnce({
        data: null,
        error: null,
      } as any);

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId },
        body: { email: 'test@example.com', role: 'member' },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { inviteMember } = await import(
        '../../controllers/membership.controller'
      );
      await inviteMember(mockRequest as any, mockReply as any);

      expect(mockReply.status).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          member: expect.any(Object),
        })
      );
    });
  });
});
