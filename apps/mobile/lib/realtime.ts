/**
 * Service de notifications en temps réel avec Supabase
 * Gère les abonnements aux changements de tâches et notifications
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Client Supabase pour le mobile
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface RealtimeTask {
  id: string;
  group_id: string;
  title: string;
  description?: string;
  status: 'open' | 'done' | 'cancelled';
  created_at: string;
}

export interface RealtimeNotification {
  id: string;
  membership_id: string;
  type: string;
  data: any;
  read_at?: string;
  created_at: string;
}

/**
 * Abonnement aux changements de tâches d'un groupe
 */
export function subscribeToTasks(
  groupId: string,
  callbacks: {
    onInsert?: (task: RealtimeTask) => void;
    onUpdate?: (task: RealtimeTask) => void;
    onDelete?: (task: RealtimeTask) => void;
  }
): RealtimeChannel {
  const channel = supabase
    .channel(`tasks:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'tasks',
        filter: `group_id=eq.${groupId}`,
      },
      (payload: any) => {
        console.log('New task created:', payload.new);
        callbacks.onInsert?.(payload.new as RealtimeTask);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tasks',
        filter: `group_id=eq.${groupId}`,
      },
      (payload: any) => {
        console.log('Task updated:', payload.new);
        callbacks.onUpdate?.(payload.new as RealtimeTask);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'tasks',
        filter: `group_id=eq.${groupId}`,
      },
      (payload: any) => {
        console.log('Task deleted:', payload.old);
        callbacks.onDelete?.(payload.old as RealtimeTask);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Abonnement aux notifications d'un membre
 */
export function subscribeToNotifications(
  membershipId: string,
  callbacks: {
    onInsert?: (notification: RealtimeNotification) => void;
    onUpdate?: (notification: RealtimeNotification) => void;
  }
): RealtimeChannel {
  const channel = supabase
    .channel(`notifications:${membershipId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `membership_id=eq.${membershipId}`,
      },
      (payload: any) => {
        console.log('New notification:', payload.new);
        callbacks.onInsert?.(payload.new as RealtimeNotification);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `membership_id=eq.${membershipId}`,
      },
      (payload: any) => {
        console.log('Notification updated:', payload.new);
        callbacks.onUpdate?.(payload.new as RealtimeNotification);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Se désabonner d'un canal
 */
export function unsubscribe(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}

/**
 * Se désabonner de tous les canaux
 */
export function unsubscribeAll(): void {
  supabase.removeAllChannels();
}
