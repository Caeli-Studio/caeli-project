import { FastifyInstance } from 'fastify';
import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
  vi,
} from 'vitest';

import { createMockSupabaseClient } from '../../__mocks__/supabase';
import { createTestApp, closeTestApp } from '../helpers/test-app';

describe('Task Controller - Unit Tests', () => {
  let app: FastifyInstance;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  const mockGroupId = 'test-group-id';
  const mockTaskId = 'test-task-id';
  const mockMembershipId = 'test-membership-id';

  beforeAll(async () => {
    app = await createTestApp();
    mockSupabase = createMockSupabaseClient();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('POST /api/groups/:group_id/tasks', () => {
    it('should create a task successfully', async () => {
      const mockTask = {
        id: mockTaskId,
        group_id: mockGroupId,
        title: 'Test Task',
        description: 'Test Description',
        status: 'open',
        required_count: 1,
        is_free: false,
        created_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockTask,
        error: null,
      });

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId },
        body: {
          title: 'Test Task',
          description: 'Test Description',
          due_at: new Date().toISOString(),
        },
        membership: { id: mockMembershipId },
        log: { error: vi.fn() },
      };

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };

      // Import and call the controller directly
      const { createTask } = await import('../../controllers/task.controller');
      await createTask(mockRequest as any, mockReply as any);

      expect(mockReply.status).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        task: mockTask,
      });
    });

    it('should handle task creation with assigned members', async () => {
      const mockTask = {
        id: mockTaskId,
        group_id: mockGroupId,
        title: 'Assigned Task',
        status: 'open',
        created_at: new Date().toISOString(),
      };

      const assignedMembers = ['member-1', 'member-2'];

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockTask, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId },
        body: {
          title: 'Assigned Task',
          assigned_to: assignedMembers,
        },
        membership: { id: mockMembershipId },
        log: { error: vi.fn() },
      };

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };

      const { createTask } = await import('../../controllers/task.controller');
      await createTask(mockRequest as any, mockReply as any);

      expect(mockReply.status).toHaveBeenCalledWith(201);
    });

    it('should handle task creation failure', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: 'ERROR' },
      });

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId },
        body: {
          title: 'Failed Task',
        },
        membership: { id: mockMembershipId },
        log: { error: vi.fn() },
      };

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };

      const { createTask } = await import('../../controllers/task.controller');
      await createTask(mockRequest as any, mockReply as any);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to create task',
        })
      );
    });
  });

  describe('GET /api/groups/:group_id/tasks', () => {
    it('should retrieve tasks for a group', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          status: 'open',
          created_at: new Date().toISOString(),
        },
        {
          id: 'task-2',
          title: 'Task 2',
          status: 'completed',
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(mockSupabase);
      mockSupabase.range.mockResolvedValueOnce({
        data: mockTasks,
        error: null,
        count: mockTasks.length,
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

      const { getTasks } = await import('../../controllers/task.controller');
      await getTasks(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          tasks: expect.any(Array),
        })
      );
    });

    it('should filter tasks by status', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Open Task',
          status: 'open',
        },
      ];

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(mockSupabase);
      mockSupabase.range.mockResolvedValueOnce({
        data: mockTasks,
        error: null,
        count: mockTasks.length,
      } as any);

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId },
        query: { status: 'open' },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { getTasks } = await import('../../controllers/task.controller');
      await getTasks(mockRequest as any, mockReply as any);

      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'open');
    });
  });

  describe('PUT /api/groups/:group_id/tasks/:task_id', () => {
    it('should update a task successfully', async () => {
      const updatedTask = {
        id: mockTaskId,
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'open',
      };

      // Reset mocks to clear any queued mockResolvedValueOnce from previous tests
      mockSupabase.single.mockReset();

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      // Chain: .eq() -> .eq() -> .select() -> .single()
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: updatedTask,
        error: null,
      } as any);

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId, task_id: mockTaskId },
        body: {
          title: 'Updated Task',
          description: 'Updated Description',
        },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { updateTask } = await import('../../controllers/task.controller');
      await updateTask(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        task: updatedTask,
      });
    });
  });

  describe('DELETE /api/groups/:group_id/tasks/:task_id', () => {
    it('should delete a task successfully', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.delete.mockReturnValue(mockSupabase);
      // First .eq() call returns mockSupabase for chaining
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      // Second .eq() call resolves with the result
      mockSupabase.eq.mockResolvedValueOnce({ data: null, error: null } as any);

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId, task_id: mockTaskId },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { deleteTask } = await import('../../controllers/task.controller');
      await deleteTask(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: 'Task deleted successfully',
      });
    });
  });

  describe('POST /api/groups/:group_id/tasks/:task_id/complete', () => {
    it('should complete a task successfully', async () => {
      const completedTask = {
        id: mockTaskId,
        status: 'completed',
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: completedTask,
        error: null,
      });

      const mockRequest = {
        supabaseClient: mockSupabase,
        params: { group_id: mockGroupId, task_id: mockTaskId },
        body: {},
        membership: { id: mockMembershipId },
        log: { error: vi.fn() },
      };

      const mockReply = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      const { completeTask } =
        await import('../../controllers/task.controller');
      await completeTask(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });
});
