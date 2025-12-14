import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockSupabaseClient } from '../../__mocks__/supabase';

describe('Transfer Controller - Unit Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  const mockGroupId = 'test-group-id';
  const mockTaskId = 'test-task-id';
  const mockTransferId = 'test-transfer-id';
  const mockFromMemberId = 'test-from-member-id';
  const mockToMemberId = 'test-to-member-id';

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  describe('POST /api/groups/:group_id/transfers', () => {
    it('should create transfer request successfully', async () => {
      const task = {
        id: mockTaskId,
        status: 'open',
      };

      const assignment = {
        id: 'assignment-id',
      };

      const newTransfer = {
        id: mockTransferId,
        group_id: mockGroupId,
        task_id: mockTaskId,
        from_membership_id: mockFromMemberId,
        to_membership_id: mockToMemberId,
        status: 'pending',
      };

      // Mock task lookup
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: task,
        error: null,
      } as any);

      // Mock assignment check
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.is.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: assignment,
        error: null,
      } as any);

      // Mock transfer insert
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.insert.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: newTransfer,
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
        membership: { id: mockFromMemberId },
        params: { group_id: mockGroupId },
        body: {
          task_id: mockTaskId,
          to_membership_id: mockToMemberId,
          message: 'Can you help with this?',
        },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { createTransfer } =
        await import('../../controllers/transfer.controller');
      await createTransfer(mockRequest as any, mockReply as any);

      expect(mockReply.status).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        transfer: newTransfer,
      });
    });

    it('should return 404 when task not found', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      } as any);

      const mockRequest = {
        supabaseClient: mockSupabase,
        membership: { id: mockFromMemberId },
        params: { group_id: mockGroupId },
        body: { task_id: 'nonexistent', to_membership_id: mockToMemberId },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { createTransfer } =
        await import('../../controllers/transfer.controller');
      await createTransfer(mockRequest as any, mockReply as any);

      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Task not found',
      });
    });
  });

  describe('GET /api/groups/:group_id/transfers', () => {
    it('should fetch all transfers for a group', async () => {
      const transfers = [
        {
          id: mockTransferId,
          group_id: mockGroupId,
          task_id: mockTaskId,
          status: 'pending',
        },
      ];

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(mockSupabase);
      mockSupabase.range.mockResolvedValueOnce({
        data: transfers,
        error: null,
      } as any);

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId },
        query: {},
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { getTransfers } =
        await import('../../controllers/transfer.controller');
      await getTransfers(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        transfers,
        total: 1,
      });
    });
  });

  describe('GET /api/groups/:group_id/transfers/:transfer_id', () => {
    it('should fetch a specific transfer', async () => {
      const transfer = {
        id: mockTransferId,
        group_id: mockGroupId,
        task_id: mockTaskId,
        status: 'pending',
        task: { id: mockTaskId, title: 'Test Task' },
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: transfer,
        error: null,
      } as any);

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId, transfer_id: mockTransferId },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { getTransfer } =
        await import('../../controllers/transfer.controller');
      await getTransfer(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        transfer,
      });
    });
  });

  describe('POST /api/groups/:group_id/transfers/:transfer_id/accept', () => {
    it('should accept transfer successfully', async () => {
      const transfer = {
        id: mockTransferId,
        task_id: mockTaskId,
        from_membership_id: mockFromMemberId,
        to_membership_id: mockToMemberId,
        status: 'pending',
      };

      // Mock transfer lookup
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: transfer,
        error: null,
      } as any);

      // Mock old assignment lookup
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.is.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'old-assignment-id' },
        error: null,
      } as any);

      // Mock assignment delete
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.delete.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      } as any);

      // Mock new assignment insert
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.insert.mockResolvedValueOnce({
        data: null,
        error: null,
      } as any);

      // Mock transfer update
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.update.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...transfer, status: 'accepted' },
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
        membership: { id: mockToMemberId },
        params: { group_id: mockGroupId, transfer_id: mockTransferId },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { acceptTransfer } =
        await import('../../controllers/transfer.controller');
      await acceptTransfer(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe('POST /api/groups/:group_id/transfers/:transfer_id/refuse', () => {
    it('should refuse transfer successfully', async () => {
      const transfer = {
        id: mockTransferId,
        task_id: mockTaskId,
        from_membership_id: mockFromMemberId,
        to_membership_id: mockToMemberId,
        status: 'pending',
      };

      // Mock transfer lookup
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: transfer,
        error: null,
      } as any);

      // Mock transfer update
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.update.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...transfer, status: 'refused' },
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
        membership: { id: mockToMemberId },
        params: { group_id: mockGroupId, transfer_id: mockTransferId },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { refuseTransfer } =
        await import('../../controllers/transfer.controller');
      await refuseTransfer(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe('DELETE /api/groups/:group_id/transfers/:transfer_id', () => {
    it('should cancel transfer successfully', async () => {
      const transfer = {
        id: mockTransferId,
        from_membership_id: mockFromMemberId,
        status: 'pending',
      };

      // Mock transfer lookup
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: transfer,
        error: null,
      } as any);

      // Mock transfer delete
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.delete.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      } as any);

      const mockRequest = {
        supabaseClient: mockSupabase,
        membership: { id: mockFromMemberId },
        params: { group_id: mockGroupId, transfer_id: mockTransferId },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { cancelTransfer } =
        await import('../../controllers/transfer.controller');
      await cancelTransfer(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: 'Transfer cancelled',
      });
    });
  });
});
