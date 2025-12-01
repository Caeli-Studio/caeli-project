import '@/global.css';

import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider as CaeliThemeProvider } from '@/contexts/ThemeContext';
import { NAV_THEME } from '@/lib/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  // Android deep link debugging
  useEffect(() => {
    if (Platform.OS === 'android') {
      const handleDeepLink = (event: { url: string }) => {
        console.log('[Android Deep Link] Received:', event.url);
      };

      const subscription = Linking.addEventListener('url', handleDeepLink);

      // Check if app was opened with a URL
      Linking.getInitialURL().then((url) => {
        if (url) {
          console.log('[Android Deep Link] Initial URL:', url);
        }
      });

      return () => {
        subscription.remove();
      };
    }
  }, []);

  return (
    <CaeliThemeProvider>
      <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
        <AuthProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Stack />
          <PortalHost />
        </AuthProvider>
      </ThemeProvider>
    </CaeliThemeProvider>
  );
}
