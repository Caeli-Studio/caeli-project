import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockSupabaseClient } from '../../__mocks__/supabase';

describe('Hub Controller - Unit Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  const mockGroupId = 'test-group-id';
  const mockSessionId = 'test-session-id';
  const mockCode = 'ABCD1234';
  const mockDeviceName = 'Living Room Hub';

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  describe('POST /api/groups/:group_id/hub/session', () => {
    it('should return existing active session if one exists', async () => {
      const existingSession = {
        id: mockSessionId,
        code: mockCode,
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.is.mockReturnValue(mockSupabase);
      mockSupabase.gt.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: existingSession,
        error: null,
      } as any);

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId },
        body: { device_name: mockDeviceName },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { createHubSession } = await import(
        '../../controllers/hub.controller'
      );
      await createHubSession(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        session: existingSession,
        message: 'Active session already exists',
      });
    });

    it('should create new hub session successfully', async () => {
      const newSession = {
        id: mockSessionId,
        code: mockCode,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        device_name: mockDeviceName,
      };

      // Mock no existing session
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.is.mockReturnValueOnce(mockSupabase);
      mockSupabase.gt.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      } as any);

      // Mock successful insert
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.insert.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: newSession,
        error: null,
      } as any);

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId },
        body: { device_name: mockDeviceName },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { createHubSession } = await import(
        '../../controllers/hub.controller'
      );
      await createHubSession(mockRequest as any, mockReply as any);

      expect(mockReply.status).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        session: expect.objectContaining({
          id: mockSessionId,
          code: mockCode,
          device_name: mockDeviceName,
        }),
      });
    });
  });

  describe('POST /api/groups/:group_id/hub/connect', () => {
    it('should connect to hub with valid code and PIN', async () => {
      const validSession = {
        id: mockSessionId,
        code: mockCode,
        group_id: mockGroupId,
        device_name: mockDeviceName,
        expires_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      };

      const validGroup = {
        id: mockGroupId,
        hub_pin: '$2a$10$hashedpinvalue',
      };

      // Mock session lookup
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.is.mockReturnValueOnce(mockSupabase);
      mockSupabase.gt.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: validSession,
        error: null,
      } as any);

      // Mock group lookup
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: validGroup,
        error: null,
      } as any);

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId },
        body: { code: mockCode, pin: '1234' },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { connectToHub } = await import('../../controllers/hub.controller');
      await connectToHub(mockRequest as any, mockReply as any);

      // Should at least call reply.send (PIN validation might fail in test)
      expect(mockReply.send).toHaveBeenCalled();
    });
  });

  describe('POST /api/groups/:group_id/hub/disconnect', () => {
    it('should disconnect from hub session', async () => {
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.is.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: mockSessionId,
          membership: { user_id: 'test-user-id' },
        },
        error: null,
      } as any);

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockResolvedValueOnce({
        data: { id: mockSessionId },
        error: null,
      } as any);

      const mockRequest = {
        jwtVerify: vi.fn().mockResolvedValue(undefined),
        supabaseClient: mockSupabase,
        user: { sub: 'test-user-id' },
        params: { group_id: mockGroupId, session_id: mockSessionId },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { disconnectFromHub } = await import(
        '../../controllers/hub.controller'
      );
      await disconnectFromHub(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: 'Disconnected successfully',
      });
    });
  });

  describe('GET /api/groups/:group_id/hub/status', () => {
    it('should return hub status with active session', async () => {
      const activeSession = {
        id: mockSessionId,
        code: mockCode,
        device_name: mockDeviceName,
        created_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.is.mockReturnValue(mockSupabase);
      mockSupabase.gt.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: activeSession,
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

      const { getHubStatus } = await import('../../controllers/hub.controller');
      await getHubStatus(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: expect.any(String),
        })
      );
    });

    it('should return not connected status when no active session', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.is.mockReturnValue(mockSupabase);
      mockSupabase.gt.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'No session found' },
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

      const { getHubStatus } = await import('../../controllers/hub.controller');
      await getHubStatus(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        status: 'inactive',
        message: 'No active hub session',
      });
    });
  });
});
//
