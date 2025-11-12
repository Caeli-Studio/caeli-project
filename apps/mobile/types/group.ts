export type GroupType = 'family' | 'roommates' | 'company' | 'other';

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  shared_calendar_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  group_id: string;
  user_id: string;
  role_name: 'owner' | 'admin' | 'member' | 'child' | 'guest';
  importance: number;
  custom_permissions: Record<string, boolean>;
  joined_at: string;
  left_at: string | null;
}

export interface CreateGroupRequest {
  name: string;
  type?: GroupType;
}

export interface CreateGroupResponse {
  success: boolean;
  data: {
    group: Group;
    membership: Membership;
  };
  message?: string;
}

export interface GetGroupsResponse {
  success: boolean;
  data: Array<{
    group: Group;
    membership: Membership;
  }>;
}
