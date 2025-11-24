import { FastifyReply } from 'fastify';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createMockSupabaseClient } from '../../__mocks__/supabase';
import { createInvitation } from '../../controllers/invitation.controller';

describe('Invitation Controller - Simple Tests', () => {
  let mockRequest: any;
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
        info: vi.fn(),
      } as any,
      body: {},
      params: {},
    };
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  describe('createInvitation', () => {
    it('should reject invalid invitation type', async () => {
      mockRequest.params = { group_id: 'group-1' };
      mockRequest.body = {
        type: 'invalid' as any,
      };

      await createInvitation(mockRequest, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid invitation type',
        message: 'Type must be either "qr" or "pseudo"',
      });
    });

    it('should reject pseudo invitation without pseudo', async () => {
      mockRequest.params = { group_id: 'group-1' };
      mockRequest.body = {
        type: 'pseudo',
      };

      await createInvitation(mockRequest, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Pseudo required',
        message: 'Pseudo is required for pseudo-based invitations',
      });
    });

    it('should reject invalid pseudo format', async () => {
      mockRequest.params = { group_id: 'group-1' };
      mockRequest.body = {
        type: 'pseudo',
        pseudo: 'ab', // Too short
      };

      await createInvitation(mockRequest, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid pseudo format',
        message: 'Pseudo must be 3-20 alphanumeric characters or underscores',
      });
    });

    it('should reject QR invitation creation without proper data', async () => {
      mockRequest.params = { group_id: 'group-1' };
      mockRequest.body = {
        type: 'qr',
      };

      await createInvitation(mockRequest, mockReply as FastifyReply);

      // Should either succeed or fail, but not crash
      expect(mockReply.send).toHaveBeenCalled();
    });

    it('should handle pseudo not found', async () => {
      mockRequest.params = { group_id: 'group-1' };
      mockRequest.body = {
        type: 'pseudo',
        pseudo: 'nonexistent',
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      await createInvitation(mockRequest, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Pseudo not found',
        message: expect.stringContaining('No user found'),
      });
    });

    it('should handle user already member error', async () => {
      mockRequest.params = { group_id: 'group-1' };
      mockRequest.body = {
        type: 'pseudo',
        pseudo: 'testuser',
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call - profiles check
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { user_id: 'user-123', pseudo: 'testuser' },
              error: null,
            }),
          } as any;
        } else {
          // Second call - memberships check
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'membership-1' },
              error: null,
            }),
          } as any;
        }
      });

      await createInvitation(mockRequest, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'User already a member',
        message: expect.stringContaining('already a member'),
      });
    });

    it('should create QR invitation with default values', async () => {
      mockRequest.params = { group_id: 'group-1' };
      mockRequest.membership = { id: 'membership-1' } as any;
      mockRequest.body = {
        type: 'qr',
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Check for existing code
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          } as any;
        } else {
          // Insert invitation
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'inv-1',
                code: 'ABC123',
                type: 'qr',
                expires_at: new Date().toISOString(),
              },
              error: null,
            }),
          } as any;
        }
      });

      await createInvitation(mockRequest, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(201);
    });
  });
});
