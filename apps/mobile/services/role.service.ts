import { apiService } from './api.service';

import type {
  GroupRole,
  GroupRoleWithStats,
  CreateRoleRequest,
  UpdateRoleRequest,
} from '../types/role';

class RoleService {
  /**
   * Get all roles for a group
   */
  async getRoles(groupId: string): Promise<GroupRoleWithStats[]> {
    const response = await apiService.get<{
      success: boolean;
      data: GroupRoleWithStats[];
    }>(`/api/groups/${groupId}/roles`);

    if (!response.success) {
      throw new Error('Failed to fetch roles');
    }

    return response.data;
  }

  /**
   * Get a specific role by ID
   */
  async getRole(groupId: string, roleId: string): Promise<GroupRoleWithStats> {
    const response = await apiService.get<{
      success: boolean;
      data: GroupRoleWithStats;
    }>(`/api/groups/${groupId}/roles/${roleId}`);

    if (!response.success) {
      throw new Error('Failed to fetch role');
    }

    return response.data;
  }

  /**
   * Create a new custom role
   */
  async createRole(
    groupId: string,
    data: CreateRoleRequest
  ): Promise<GroupRole> {
    const response = await apiService.post<{
      success: boolean;
      data: GroupRole;
    }>(`/api/groups/${groupId}/roles`, data);

    if (!response.success) {
      throw new Error('Failed to create role');
    }

    return response.data;
  }

  /**
   * Update an existing custom role
   */
  async updateRole(
    groupId: string,
    roleId: string,
    data: UpdateRoleRequest
  ): Promise<GroupRole> {
    const response = await apiService.put<{
      success: boolean;
      data: GroupRole;
    }>(`/api/groups/${groupId}/roles/${roleId}`, data);

    if (!response.success) {
      throw new Error('Failed to update role');
    }

    return response.data;
  }

  /**
   * Delete a custom role
   */
  async deleteRole(groupId: string, roleId: string): Promise<void> {
    await apiService.delete<{
      success: boolean;
    }>(`/api/groups/${groupId}/roles/${roleId}`);

    // No need to check response.success for 204 responses
  }
}

export const roleService = new RoleService();
