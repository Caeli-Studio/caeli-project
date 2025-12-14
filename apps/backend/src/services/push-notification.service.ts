/**
 * Push Notification Service
 *
 * Handles sending push notifications via Expo Push Notification service.
 * Supports sending notifications to multiple devices and handles chunking for bulk sends.
 */

import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Interface for push notification data
 */
export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
}

/**
 * Send push notifications to multiple devices
 *
 * @param pushTokens - Array of Expo push tokens
 * @param notification - Notification data to send
 * @returns Array of push tickets from Expo service
 *
 * @example
 * ```typescript
 * await sendPushNotifications(
 *   ['ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'],
 *   {
 *     title: 'Nouvelle tâche',
 *     body: 'Une tâche vous a été assignée',
 *     data: { taskId: '123', type: 'task_assigned' }
 *   }
 * );
 * ```
 */
export async function sendPushNotifications(
  pushTokens: string[],
  notification: PushNotification
): Promise<ExpoPushTicket[]> {
  const messages: ExpoPushMessage[] = [];

  // Validate and build messages
  for (const pushToken of pushTokens) {
    // Check if token is valid Expo push token
    if (!Expo.isExpoPushToken(pushToken)) {
      console.warn(`Invalid Expo push token: ${pushToken}`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: notification.sound ?? 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data,
      badge: notification.badge,
    });
  }

  // No valid tokens, return early
  if (messages.length === 0) {
    console.warn('No valid push tokens to send notifications to');
    return [];
  }

  // Chunk messages (Expo has a limit of 100 notifications per request)
  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];

  // Send each chunk
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
      console.log(
        `Sent push notification chunk (${chunk.length} notifications)`
      );
    } catch (error) {
      console.error('Error sending push notification chunk:', error);
    }
  }

  return tickets;
}

/**
 * Send a single push notification to one device
 *
 * @param pushToken - Expo push token
 * @param notification - Notification data
 * @returns Push ticket from Expo service or null if failed
 *
 * @example
 * ```typescript
 * await sendSinglePushNotification(
 *   'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
 *   {
 *     title: 'Rappel',
 *     body: 'N\'oubliez pas votre tâche',
 *     data: { taskId: '123' }
 *   }
 * );
 * ```
 */
export async function sendSinglePushNotification(
  pushToken: string,
  notification: PushNotification
): Promise<ExpoPushTicket | null> {
  const tickets = await sendPushNotifications([pushToken], notification);
  return tickets.length > 0 ? tickets[0] : null;
}
