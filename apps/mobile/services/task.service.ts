import { apiService } from './api.service';

import type {
  AssignTaskRequest,
  AssignTaskResponse,
  CompleteTaskResponse,
  CreateTaskRequest,
  CreateTaskResponse,
  GetTaskResponse,
  GetTasksResponse,
  TaskQueryParams,
  UpdateTaskRequest,
  UpdateTaskResponse,
} from '@/types/task';

/**
 * Task Service
 * Handles all task-related API operations
 */
class TaskService {
  /**
   * Create a new task
   * @param groupId - The group/household ID
   * @param data - Task creation data
   */
  async createTask(
    groupId: string,
    data: CreateTaskRequest
  ): Promise<CreateTaskResponse> {
    return apiService.post<CreateTaskResponse>(
      `/api/groups/${groupId}/tasks`,
      data
    );
  }

  /**
   * Get all tasks for a group
   * @param groupId - The group/household ID
   * @param params - Query parameters for filtering
   */
  async getTasks(
    groupId: string,
    params?: TaskQueryParams
  ): Promise<GetTasksResponse> {
    const queryString = params ? this.buildQueryString(params) : '';
    return apiService.get<GetTasksResponse>(
      `/api/groups/${groupId}/tasks${queryString}`
    );
  }

  /**
   * Get a specific task
   * @param groupId - The group/household ID
   * @param taskId - The task ID
   */
  async getTask(groupId: string, taskId: string): Promise<GetTaskResponse> {
    return apiService.get<GetTaskResponse>(
      `/api/groups/${groupId}/tasks/${taskId}`
    );
  }

  /**
   * Update a task
   * @param groupId - The group/household ID
   * @param taskId - The task ID
   * @param data - Task update data
   */
  async updateTask(
    groupId: string,
    taskId: string,
    data: UpdateTaskRequest
  ): Promise<UpdateTaskResponse> {
    return apiService.put<UpdateTaskResponse>(
      `/api/groups/${groupId}/tasks/${taskId}`,
      data
    );
  }

  /**
   * Delete a task
   * @param groupId - The group/household ID
   * @param taskId - The task ID
   */
  async deleteTask(
    groupId: string,
    taskId: string
  ): Promise<{ success: boolean; message: string }> {
    return apiService.delete<{ success: boolean; message: string }>(
      `/api/groups/${groupId}/tasks/${taskId}`
    );
  }

  /**
   * Assign task to members
   * @param groupId - The group/household ID
   * @param taskId - The task ID
   * @param data - Assignment data (membership IDs)
   */
  async assignTask(
    groupId: string,
    taskId: string,
    data: AssignTaskRequest
  ): Promise<AssignTaskResponse> {
    return apiService.post<AssignTaskResponse>(
      `/api/groups/${groupId}/tasks/${taskId}/assign`,
      data
    );
  }

  /**
   * Complete a task
   * @param groupId - The group/household ID
   * @param taskId - The task ID
   */
  async completeTask(
    groupId: string,
    taskId: string
  ): Promise<CompleteTaskResponse> {
    return apiService.post<CompleteTaskResponse>(
      `/api/groups/${groupId}/tasks/${taskId}/complete`
    );
  }

  /**
   * Take a free task (self-assign)
   * @param groupId - The group/household ID
   * @param taskId - The task ID
   */
  async takeTask(
    groupId: string,
    taskId: string
  ): Promise<{ success: boolean; message: string }> {
    return apiService.post<{ success: boolean; message: string }>(
      `/api/groups/${groupId}/tasks/${taskId}/take`
    );
  }

  /**
   * Helper to build query string from params
   */
  private buildQueryString(params: TaskQueryParams): string {
    const queryParams = new URLSearchParams();

    if (params.status) queryParams.append('status', params.status);
    if (params.assigned_to_me !== undefined)
      queryParams.append('assigned_to_me', String(params.assigned_to_me));
    if (params.is_free !== undefined)
      queryParams.append('is_free', String(params.is_free));
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.offset) queryParams.append('offset', String(params.offset));

    const query = queryParams.toString();
    return query ? `?${query}` : '';
  }
}

export const taskService = new TaskService();
