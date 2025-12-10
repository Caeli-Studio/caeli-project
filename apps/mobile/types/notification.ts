/**
 * Notification Types and Interfaces
 *
 * Defines the notification data structures matching the backend schema
 */

/**
 * Notification types matching backend enum
 */
export type NotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'transfer_request'
  | 'ping'
  | 'role_changed'
  | 'task_reminder';

/**
 * Notification data structure from backend
 */
export interface NotificationData {
  id: string;
  membership_id: string;
  type: NotificationType;
  data: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

/**
 * Push notification payload received from Expo
 */
export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: {
    type: NotificationType;
    task_id?: string;
    transfer_id?: string;
    member_id?: string;
    [key: string]: any;
  };
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  enabled: boolean;
  task_assigned: boolean;
  task_completed: boolean;
  transfer_request: boolean;
  new_member: boolean;
  role_changed: boolean;
}

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  task_assigned: true,
  task_completed: true,
  transfer_request: true,
  new_member: true,
  role_changed: true,
};
