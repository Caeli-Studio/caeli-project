import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Alert, Platform } from 'react-native';

import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS } from '@/lib/config';
import { storage } from '@/lib/storage';

/**
 * OAuth Callback Handler
 * Handles the redirect from Google OAuth and exchanges the code for a session
 */
export default function AuthCallbackScreen() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { refreshSession } = useAuth();
  const [isProcessing, setIsProcessing] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Debug logging for all platforms
  useEffect(() => {
    console.log('[OAuth Callback] Platform:', Platform.OS);
    console.log(
      '[OAuth Callback] All params:',
      JSON.stringify(params, null, 2)
    );
    console.log('[OAuth Callback] Code:', params.code);
    console.log('[OAuth Callback] Error:', params.error);
    console.log(
      '[OAuth Callback] Error Description:',
      params.error_description
    );
  }, [params]);

  const handleCallback = React.useCallback(async () => {
    try {
      // Check for error in callback
      if (params.error) {
        const errorMessage = params.error_description || params.error;
        setError(errorMessage as string);
        Alert.alert('Authentication Error', errorMessage as string, [
          { text: 'OK', onPress: () => router.replace('/') },
        ]);
        return;
      }

      // Extract authorization code
      const code = params.code as string;

      if (!code) {
        setError('No authorization code received');
        Alert.alert('Authentication Error', 'No authorization code received', [
          { text: 'OK', onPress: () => router.replace('/') },
        ]);
        return;
      }

      // Exchange code for session
      const response = await fetch(
        `${API_ENDPOINTS.AUTH_CALLBACK}?code=${code}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to exchange code for session');
      }

      // Save session and user data
      if (data.session && data.user) {
        await storage.saveSession(data.session);
        await storage.saveUser(data.user);

        // Refresh the auth context
        await refreshSession();

        // Navigate to home
        router.replace('/home');
      } else {
        throw new Error('Invalid session data received');
      }
    } catch (err) {
      console.error('Error handling OAuth callback:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      Alert.alert('Authentication Error', errorMessage, [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    } finally {
      setIsProcessing(false);
    }
  }, [params, refreshSession, router]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      {isProcessing ? (
        <>
          <ActivityIndicator
            size="large"
            color={colorScheme === 'dark' ? '#fff' : '#000'}
          />
          <Text className="mt-4 text-center text-muted-foreground">
            Completing authentication...
          </Text>
        </>
      ) : error ? (
        <Text className="text-center text-destructive">{error}</Text>
      ) : (
        <Text className="text-center text-foreground">
          Redirecting to home...
        </Text>
      )}
    </View>
  );
}
