/**
 * Database entity types matching the PostgreSQL schema
 */

// Enums
export type GroupType = 'family' | 'roommates' | 'company' | 'other';
export type TaskStatus = 'open' | 'done' | 'cancelled';
export type TransferStatus = 'pending' | 'accepted' | 'refused' | 'cancelled';
export type NotificationType =
  | 'task_reminder'
  | 'transfer_request'
  | 'ping'
  | 'task_assigned'
  | 'task_completed'
  | 'role_changed';
export type CalendarProvider = 'google' | 'apple';
export type CalendarVisibility = 'full' | 'busy' | 'hidden';
export type Locale = 'en' | 'fr';

// Address type
export interface Address {
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

// =====================================================
// DATABASE ENTITIES
// =====================================================

export interface Profile {
  user_id: string;
  display_name: string;
  pseudo?: string;
  avatar_url?: string;
  pin_hash?: string;
  locale: Locale;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  shared_calendar_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  group_id: string;
  user_id: string;
  role_name: string;
  importance: number;
  custom_permissions: Record<string, boolean>;
  joined_at: string;
  left_at?: string;
}

export interface TaskTemplate {
  id: string;
  group_id: string;
  title: string;
  description?: string;
  required_count: number;
  is_free: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

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

export interface TaskTransfer {
  id: string;
  group_id: string;
  task_id: string;
  from_membership_id: string;
  to_membership_id?: string;
  return_task_id?: string;
  status: TransferStatus;
  message?: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface Notification {
  id: string;
  membership_id: string;
  type: NotificationType;
  data: Record<string, unknown>;
  read_at?: string;
  created_at: string;
}

export interface HubSession {
  id: string;
  group_id: string;
  membership_id?: string;
  device_name: string;
  code: string;
  expires_at: string;
  connected_at?: string;
  disconnected_at?: string;
  created_at: string;
}

export interface CalendarConnection {
  id: string;
  membership_id: string;
  provider: CalendarProvider;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  scope?: string;
  created_at: string;
  updated_at: string;
}

export interface MemberPreferences {
  id: string;
  membership_id: string;
  group_id: string;
  work_address?: Address;
  school_address?: Address;
  brief_hour?: string;
  calendar_visibility: CalendarVisibility;
  preferences: Record<string, unknown>;
}

export interface AuditLog {
  id: number;
  group_id?: string;
  actor_membership_id?: string;
  action: string;
  subject_type: string;
  subject_id?: string;
  metadata: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface Invitation {
  id: string;
  group_id: string;
  code?: string;
  pseudo?: string;
  created_by: string;
  max_uses: number;
  current_uses: number;
  expires_at: string;
  created_at: string;
  revoked_at?: string;
}

// =====================================================
// EXTENDED/POPULATED ENTITIES
// =====================================================

export interface MembershipWithProfile extends Membership {
  profile: Profile;
}

export interface TaskWithAssignments extends Task {
  assignments: TaskAssignment[];
  assigned_members?: MembershipWithProfile[];
}

export interface TaskWithDetails extends Task {
  assignments: TaskAssignment[];
  assigned_members: MembershipWithProfile[];
  creator?: MembershipWithProfile;
  template?: TaskTemplate;
}

export interface GroupWithMembers extends Group {
  members: MembershipWithProfile[];
  member_count: number;
}

export interface TransferWithDetails extends TaskTransfer {
  task: Task;
  from_member: MembershipWithProfile;
  to_member?: MembershipWithProfile;
  return_task?: Task;
  resolver?: MembershipWithProfile;
}

export interface NotificationWithDetails extends Notification {
  membership: MembershipWithProfile;
}

// =====================================================
// REQUEST/RESPONSE TYPES
// =====================================================

// Profile
export interface CreateProfileRequest {
  display_name: string;
  pseudo?: string;
  avatar_url?: string;
  locale?: Locale;
}

export interface UpdateProfileRequest {
  display_name?: string;
  pseudo?: string;
  avatar_url?: string;
  locale?: Locale;
  pin?: string; // Will be hashed
}

export interface ProfileResponse extends Omit<Profile, 'pin_hash'> {
  memberships?: GroupWithMembers[];
}

// Group
export interface CreateGroupRequest {
  name: string;
  type?: GroupType;
}

export interface UpdateGroupRequest {
  name?: string;
  type?: GroupType;
  shared_calendar_id?: string;
}

export interface GroupResponse extends Group {
  members?: MembershipWithProfile[];
  my_membership?: Membership;
  member_count?: number;
}

// Membership
export interface InviteMemberRequest {
  email?: string;
  user_id?: string;
  role_name?: string;
  importance?: number;
}

export interface UpdateMembershipRequest {
  role_name?: string;
  importance?: number;
  custom_permissions?: Record<string, boolean>;
}

export interface MembershipResponse extends Membership {
  profile: Profile;
  group?: Group;
  preferences?: MemberPreferences;
}

// Task
export interface CreateTaskRequest {
  title: string;
  description?: string;
  due_at?: string;
  required_count?: number;
  is_free?: boolean;
  template_id?: string;
  assigned_to?: string[]; // membership IDs
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  due_at?: string;
  required_count?: number;
  is_free?: boolean;
  status?: TaskStatus;
}

export interface AssignTaskRequest {
  membership_ids: string[];
}

export interface CompleteTaskRequest {
  membership_id?: string; // If not provided, use current user's membership
}

export interface TaskResponse extends Task {
  assignments?: TaskAssignment[];
  assigned_members?: MembershipWithProfile[];
  creator?: MembershipWithProfile;
  template?: TaskTemplate;
  can_complete?: boolean;
  can_transfer?: boolean;
}

// Task Transfer
export interface CreateTransferRequest {
  task_id: string;
  to_membership_id?: string; // If null, it's a general offer
  return_task_id?: string; // For exchanges
  message?: string;
}

export interface ResolveTransferRequest {
  action: 'accept' | 'refuse' | 'cancel';
}

export interface TransferResponse extends TaskTransfer {
  task: Task;
  from_member: MembershipWithProfile;
  to_member?: MembershipWithProfile;
  return_task?: Task;
  resolver?: MembershipWithProfile;
}

// Notifications
export interface NotificationResponse extends Notification {
  membership?: MembershipWithProfile;
}

export interface MarkNotificationsReadRequest {
  notification_ids?: string[]; // If not provided, mark all as read
}

// Hub Sessions
export interface CreateHubSessionRequest {
  device_name: string;
}

export interface ConnectToHubRequest {
  code: string;
  pin: string;
}

export interface HubSessionResponse extends HubSession {
  group?: Group;
  connected_member?: MembershipWithProfile;
}

// Calendar
export interface ConnectCalendarRequest {
  provider: CalendarProvider;
  authorization_code: string;
}

export interface CalendarConnectionResponse
  extends Omit<CalendarConnection, 'access_token' | 'refresh_token'> {
  is_active: boolean;
}

// Preferences
export interface UpdatePreferencesRequest {
  work_address?: Address;
  school_address?: Address;
  brief_hour?: string;
  calendar_visibility?: CalendarVisibility;
  preferences?: Record<string, unknown>;
}

export type PreferencesResponse = MemberPreferences;

// Task Templates
export interface CreateTaskTemplateRequest {
  title: string;
  description?: string;
  required_count?: number;
  is_free?: boolean;
}

export interface UpdateTaskTemplateRequest {
  title?: string;
  description?: string;
  required_count?: number;
  is_free?: boolean;
}

export interface TaskTemplateResponse extends TaskTemplate {
  creator?: MembershipWithProfile;
}

// Invitation
export interface CreateInvitationRequest {
  type: 'qr' | 'pseudo';
  pseudo?: string; // Required if type = 'pseudo'
  expires_in_hours?: number; // Default: 24
  max_uses?: number; // Default: 1
}

export interface AcceptInvitationRequest {
  code_or_pseudo: string;
}

export interface InvitationResponse extends Invitation {
  group?: Group;
  creator?: MembershipWithProfile;
}

// =====================================================
// QUERY PARAMETERS
// =====================================================

export interface TaskQueryParams {
  status?: TaskStatus;
  assigned_to_me?: boolean;
  is_free?: boolean;
  from?: string; // ISO date
  to?: string; // ISO date
  limit?: number;
  offset?: number;
}

export interface TransferQueryParams {
  status?: TransferStatus;
  from_me?: boolean;
  to_me?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationQueryParams {
  unread_only?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

export interface AuditLogQueryParams {
  subject_type?: string;
  subject_id?: string;
  actor_membership_id?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

// =====================================================
// STATISTICS & ANALYTICS
// =====================================================

export interface TaskStatistics {
  total_tasks: number;
  open_tasks: number;
  completed_tasks: number;
  my_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
}

export interface MemberStatistics {
  member: MembershipWithProfile;
  tasks_completed: number;
  tasks_assigned: number;
  completion_rate: number;
  average_completion_time?: number; // in hours
}

export interface GroupStatistics {
  group: Group;
  total_members: number;
  active_tasks: number;
  completed_tasks_this_week: number;
  member_stats: MemberStatistics[];
}

// =====================================================
// PERMISSIONS
// =====================================================

export interface Permission {
  can_create_tasks: boolean;
  can_assign_tasks: boolean;
  can_delete_tasks: boolean;
  can_manage_members: boolean;
  can_edit_group: boolean;
  can_view_audit_log: boolean;
  can_connect_calendar: boolean;
  can_manage_hub: boolean;
}

export const DEFAULT_PERMISSIONS: Record<string, Permission> = {
  owner: {
    can_create_tasks: true,
    can_assign_tasks: true,
    can_delete_tasks: true,
    can_manage_members: true,
    can_edit_group: true,
    can_view_audit_log: true,
    can_connect_calendar: true,
    can_manage_hub: true,
  },
  admin: {
    can_create_tasks: true,
    can_assign_tasks: true,
    can_delete_tasks: true,
    can_manage_members: true,
    can_edit_group: true,
    can_view_audit_log: true,
    can_connect_calendar: true,
    can_manage_hub: true,
  },
  member: {
    can_create_tasks: true,
    can_assign_tasks: false,
    can_delete_tasks: false,
    can_manage_members: false,
    can_edit_group: false,
    can_view_audit_log: false,
    can_connect_calendar: true,
    can_manage_hub: false,
  },
  child: {
    can_create_tasks: false,
    can_assign_tasks: false,
    can_delete_tasks: false,
    can_manage_members: false,
    can_edit_group: false,
    can_view_audit_log: false,
    can_connect_calendar: false,
    can_manage_hub: false,
  },
  guest: {
    can_create_tasks: false,
    can_assign_tasks: false,
    can_delete_tasks: false,
    can_manage_members: false,
    can_edit_group: false,
    can_view_audit_log: false,
    can_connect_calendar: false,
    can_manage_hub: false,
  },
};
