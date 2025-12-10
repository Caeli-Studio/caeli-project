/**
 * Notification Service
 *
 * Handles Expo push notifications including:
 * - Permission requests
 * - Token registration with backend
 * - Local notification display
 * - Notification response handling
 */

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { PushNotificationPayload } from '@/types/notification';

import { API_BASE_URL, EXPO_PROJECT_ID } from '@/lib/config';

/**
 * Configure how notifications are handled when app is in foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user
 *
 * @returns Promise<boolean> - True if permissions granted
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  // Only real devices can receive push notifications
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return false;
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get Expo push token for this device
 *
 * @returns Promise<string | null> - Expo push token or null if failed
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.warn('Cannot get push token on emulator/simulator');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: EXPO_PROJECT_ID,
    });

    return token.data;
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    return null;
  }
}

/**
 * Register push token with backend
 *
 * @param token - Expo push token
 * @param accessToken - User JWT access token
 * @returns Promise<boolean> - True if registration successful
 */
export async function registerPushToken(
  token: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      console.error('Failed to register push token:', response.statusText);
      return false;
    }

    console.log('Push token registered successfully');
    return true;
  } catch (error) {
    console.error('Error registering push token:', error);
    return false;
  }
}

/**
 * Unregister push token from backend
 *
 * @param token - Expo push token
 * @param accessToken - User JWT access token
 * @returns Promise<boolean> - True if unregistration successful
 */
export async function unregisterPushToken(
  token: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/push-token`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      console.error('Failed to unregister push token:', response.statusText);
      return false;
    }

    console.log('Push token unregistered successfully');
    return true;
  } catch (error) {
    console.error('Error unregistering push token:', error);
    return false;
  }
}

/**
 * Schedule a local notification
 *
 * @param notification - Notification payload
 */
export async function scheduleLocalNotification(
  notification: PushNotificationPayload
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: true,
      },
      trigger: null, // Display immediately
    });
  } catch (error) {
    console.error('Error scheduling local notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
}

/**
 * Add listener for when notification is received while app is in foreground
 *
 * @param callback - Function to call when notification received
 * @returns Subscription object (call .remove() to unsubscribe)
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add listener for when user taps on notification
 *
 * @param callback - Function to call when notification is tapped
 * @returns Subscription object (call .remove() to unsubscribe)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
