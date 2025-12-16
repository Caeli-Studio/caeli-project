/**
 * Notification Context
 *
 * Provides app-wide notification state management including:
 * - Permission handling
 * - Push token registration
 * - Real-time subscription management
 * - Notification preferences
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getExpoPushToken,
  registerPushToken,
  requestNotificationPermissions,
  unregisterPushToken,
} from '@/services/notification.service';
import {
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from '@/services/realtime.service';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferences,
} from '@/types/notification';

const PREFERENCES_STORAGE_KEY = '@notification_preferences';
const PUSH_TOKEN_STORAGE_KEY = '@push_token';

interface NotificationContextValue {
  // State
  permissionsGranted: boolean;
  preferences: NotificationPreferences;
  isInitialized: boolean;

  // Actions
  initializeNotifications: (
    membershipId: string,
    accessToken: string
  ) => Promise<void>;
  updatePreferences: (
    newPreferences: Partial<NotificationPreferences>
  ) => Promise<void>;
  cleanup: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentMembershipId, setCurrentMembershipId] = useState<string | null>(
    null
  );
  const [currentAccessToken, setCurrentAccessToken] = useState<string | null>(
    null
  );

  /**
   * Load notification preferences from storage
   */
  const loadPreferences = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  }, []);

  /**
   * Save notification preferences to storage
   */
  const savePreferences = useCallback(
    async (newPreferences: NotificationPreferences) => {
      try {
        await AsyncStorage.setItem(
          PREFERENCES_STORAGE_KEY,
          JSON.stringify(newPreferences)
        );
      } catch (error) {
        console.error('Error saving notification preferences:', error);
      }
    },
    []
  );

  /**
   * Update notification preferences
   */
  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      const updated = { ...preferences, ...newPreferences };
      setPreferences(updated);
      await savePreferences(updated);

      // If notifications were disabled, cleanup
      if (!updated.enabled && currentMembershipId) {
        unsubscribeFromNotifications();
      }

      // If notifications were enabled and we have a membership, resubscribe
      if (updated.enabled && currentMembershipId) {
        subscribeToNotifications(currentMembershipId, {
          task_assigned: updated.task_assigned,
          task_completed: updated.task_completed,
          transfer_request: updated.transfer_request,
          new_member: updated.new_member,
          role_changed: updated.role_changed,
        });
      }
    },
    [preferences, currentMembershipId, savePreferences]
  );

  /**
   * Initialize notifications system
   */
  const initializeNotifications = useCallback(
    async (membershipId: string, accessToken: string) => {
      try {
        console.log('Initializing notifications...');

        // Load preferences first
        await loadPreferences();

        // Store current membership and token
        setCurrentMembershipId(membershipId);
        setCurrentAccessToken(accessToken);

        // Check if notifications are enabled in preferences
        const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
        const currentPrefs = stored
          ? { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(stored) }
          : DEFAULT_NOTIFICATION_PREFERENCES;

        if (!currentPrefs.enabled) {
          console.log('Notifications are disabled in preferences');
          setIsInitialized(true);
          return;
        }

        // Request permissions
        const granted = await requestNotificationPermissions();
        setPermissionsGranted(granted);

        if (!granted) {
          console.warn('Notification permissions not granted');
          setIsInitialized(true);
          return;
        }

        // Get and register push token
        const pushToken = await getExpoPushToken();
        if (pushToken) {
          const registered = await registerPushToken(pushToken, accessToken);
          if (registered) {
            await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, pushToken);
          }
        }

        // Subscribe to real-time notifications
        subscribeToNotifications(membershipId, {
          task_assigned: currentPrefs.task_assigned,
          task_completed: currentPrefs.task_completed,
          transfer_request: currentPrefs.transfer_request,
          new_member: currentPrefs.new_member,
          role_changed: currentPrefs.role_changed,
        });

        setIsInitialized(true);
        console.log('Notifications initialized successfully');
      } catch (error) {
        console.error('Error initializing notifications:', error);
        setIsInitialized(true);
      }
    },
    [loadPreferences]
  );

  /**
   * Cleanup notifications system
   */
  const cleanup = useCallback(async () => {
    try {
      // Unsubscribe from real-time
      unsubscribeFromNotifications();

      // Unregister push token if we have one
      const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
      if (storedToken && currentAccessToken) {
        await unregisterPushToken(storedToken, currentAccessToken);
        await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
      }

      setCurrentMembershipId(null);
      setCurrentAccessToken(null);
      setIsInitialized(false);
      console.log('Notifications cleaned up');
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  }, [currentAccessToken]);

  /**
   * Set up notification listeners on mount
   */
  useEffect(() => {
    // Listen for notifications received while app is open
    const receivedSubscription = addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Listen for notification taps
    const responseSubscription = addNotificationResponseListener((response) => {
      console.log('Notification tapped:', response);

      const data = response.notification.request.content.data;

      // Navigate based on notification type
      if (data?.type === 'task_assigned' && data?.task_id) {
        router.push(`/(app)/tasks/${data.task_id}` as any);
      } else if (data?.type === 'task_completed' && data?.task_id) {
        router.push(`/(app)/tasks/${data.task_id}` as any);
      } else if (data?.type === 'transfer_request') {
        // Navigate to transfers screen with filter for received
        router.push('/task-transfers' as any);
      }
    });

    // Cleanup listeners on unmount
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const value: NotificationContextValue = {
    permissionsGranted,
    preferences,
    isInitialized,
    initializeNotifications,
    updatePreferences,
    cleanup,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to access notification context
 */
export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within NotificationProvider'
    );
  }
  return context;
}
