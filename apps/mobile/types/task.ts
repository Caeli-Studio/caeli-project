/**
 * Task types mirroring backend types
 */

export type TaskStatus = 'open' | 'done' | 'cancelled';

export interface Task {
  id: string;
  group_id: string;
  template_id?: string;
  title: string;
  description?: string;
  due_at?: string;
  required_count: number;
  is_free: boolean;
  status: TaskStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  membership_id: string;
  assigned_at: string;
  completed_at?: string;
}

export interface MembershipWithProfile {
  id: string;
  group_id: string;
  user_id: string;
  role_name: string;
  importance: number;
  profile: {
    user_id: string;
    display_name: string;
    pseudo?: string;
    avatar_url?: string;
  };
}

export interface TaskWithDetails extends Task {
  assignments?: TaskAssignment[];
  assigned_members?: MembershipWithProfile[];
  creator?: MembershipWithProfile;
  can_complete?: boolean;
  can_transfer?: boolean;
}

/**
 * Request/Response types
 */

export interface CreateTaskRequest {
  title: string;
  description?: string;
  due_at?: string;
  required_count?: number;
  is_free?: boolean;
  template_id?: string;
  assigned_membership_ids?: string[];
}

export interface CreateTaskResponse {
  success: boolean;
  task: Task;
}

export interface GetTasksResponse {
  success: boolean;
  tasks: TaskWithDetails[];
  total: number;
}

export interface GetTaskResponse {
  success: boolean;
  task: TaskWithDetails;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  due_at?: string;
  required_count?: number;
  is_free?: boolean;
  status?: TaskStatus;
}

export interface UpdateTaskResponse {
  success: boolean;
  task: Task;
}

export interface AssignTaskRequest {
  membership_ids: string[];
}

export interface AssignTaskResponse {
  success: boolean;
  message: string;
}

export interface CompleteTaskResponse {
  success: boolean;
  message: string;
  task_status: 'done' | 'partially_completed';
}

export interface TaskQueryParams {
  status?: TaskStatus;
  assigned_to_me?: boolean;
  is_free?: boolean;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}
