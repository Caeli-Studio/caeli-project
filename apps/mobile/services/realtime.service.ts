/**
 * Supabase Realtime Service
 *
 * Handles real-time subscriptions to database changes for notifications
 * Works when app is open to provide instant notification updates
 */

import {
  createClient,
  RealtimeChannel,
  SupabaseClient,
} from '@supabase/supabase-js';

import { scheduleLocalNotification } from './notification.service';

import type { NotificationData, NotificationType } from '@/types/notification';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';

let supabaseClient: SupabaseClient | null = null;
let notificationChannel: RealtimeChannel | null = null;

/**
 * Initialize Supabase client for realtime subscriptions
 */
export function initializeSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      '[Realtime] Supabase config missing. Realtime notifications disabled.'
    );
    return null;
  }

  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
    },
  });

  return supabaseClient;
}

/**
 * Get the Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient | null {
  return supabaseClient;
}

/**
 * Get notification title based on type
 */
function getNotificationTitle(type: NotificationType): string {
  switch (type) {
    case 'task_assigned':
      return 'Nouvelle tâche assignée';
    case 'task_completed':
      return 'Tâche terminée';
    case 'transfer_request':
      return 'Demande de transfert';
    case 'ping':
      return 'Nouveau membre';
    case 'role_changed':
      return 'Rôle modifié';
    case 'task_reminder':
      return 'Rappel de tâche';
    default:
      return 'Notification';
  }
}

/**
 * Get notification body based on type and data
 */
function getNotificationBody(
  type: NotificationType,
  data: Record<string, any>
): string {
  switch (type) {
    case 'task_assigned':
      return data.task_title
        ? `Vous avez été assigné à: ${data.task_title}`
        : 'Une nouvelle tâche vous a été assignée';
    case 'task_completed':
      return data.task_title
        ? `${data.task_title} a été complétée`
        : 'Une tâche a été terminée';
    case 'transfer_request':
      return 'Vous avez reçu une demande de transfert';
    case 'ping':
      return data.member_name
        ? `${data.member_name} a rejoint le groupe`
        : 'Un nouveau membre a rejoint le groupe';
    case 'role_changed':
      return data.new_role
        ? `Votre rôle a été changé en: ${data.new_role}`
        : 'Votre rôle a été modifié';
    case 'task_reminder':
      return data.task_title
        ? `Rappel: ${data.task_title}`
        : 'Vous avez une tâche en attente';
    default:
      return 'Vous avez une nouvelle notification';
  }
}

/**
 * Subscribe to real-time notifications for a specific user (membership)
 *
 * @param membershipId - User's membership ID in the current group
 * @param preferences - Notification preferences to filter notifications
 * @returns Cleanup function to unsubscribe
 */
export function subscribeToNotifications(
  membershipId: string,
  preferences: {
    task_assigned: boolean;
    task_completed: boolean;
    transfer_request: boolean;
    new_member: boolean;
    role_changed: boolean;
  }
): () => void {
  const client = initializeSupabaseClient();

  if (!client) {
    return () => {};
  }

  // Unsubscribe from previous channel if exists
  if (notificationChannel) {
    notificationChannel.unsubscribe();
  }

  // Create a new channel for this membership
  notificationChannel = client
    .channel(`notifications:${membershipId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `membership_id=eq.${membershipId}`,
      },
      async (payload) => {
        const notification = payload.new as NotificationData;

        // Check if this notification type is enabled in preferences
        const typeEnabled = (() => {
          switch (notification.type) {
            case 'task_assigned':
              return preferences.task_assigned;
            case 'task_completed':
              return preferences.task_completed;
            case 'transfer_request':
              return preferences.transfer_request;
            case 'ping':
              return preferences.new_member;
            case 'role_changed':
              return preferences.role_changed;
            default:
              return true; // Show by default for unknown types
          }
        })();

        if (!typeEnabled) {
          console.log(
            `Notification type ${notification.type} is disabled in preferences`
          );
          return;
        }

        // Show local notification
        const title = getNotificationTitle(notification.type);
        const body = getNotificationBody(notification.type, notification.data);

        await scheduleLocalNotification({
          title,
          body,
          data: {
            type: notification.type,
            ...notification.data,
          },
        });

        console.log('Real-time notification received and displayed:', {
          type: notification.type,
          title,
        });
      }
    )
    .subscribe((status) => {
      console.log('Notification subscription status:', status);
    });

  // Return cleanup function
  return () => {
    if (notificationChannel) {
      notificationChannel.unsubscribe();
      notificationChannel = null;
    }
  };
}

/**
 * Unsubscribe from all real-time notifications
 */
export function unsubscribeFromNotifications(): void {
  if (notificationChannel) {
    notificationChannel.unsubscribe();
    notificationChannel = null;
  }
}

/**
 * Clean up Supabase client and all subscriptions
 */
export function cleanupSupabase(): void {
  unsubscribeFromNotifications();
  supabaseClient = null;
}
