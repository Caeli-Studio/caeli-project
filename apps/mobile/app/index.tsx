import { Stack, useRouter } from 'expo-router';
import { MoonStarIcon, SunIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/AuthContext';
import { THEME } from '@/lib/theme';

const SCREEN_OPTIONS = {
  light: {
    title: 'Caeli',
    headerTransparent: true,
    headerShadowVisible: true,
    headerStyle: { backgroundColor: THEME.light.background },
    headerRight: () => <ThemeToggle />,
  },
  dark: {
    title: 'Caeli',
    headerTransparent: true,
    headerShadowVisible: true,
    headerStyle: { backgroundColor: THEME.dark.background },
    headerRight: () => <ThemeToggle />,
  },
};

export default function AuthScreen() {
  const { colorScheme } = useColorScheme();
  const { isLoading, isAuthenticated, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  // Redirect to home if already authenticated
  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/home');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      const result = await signInWithGoogle();

      if (result.success) {
        // Navigation will happen automatically via the useEffect above
      } else {
        Alert.alert(
          'Sign In Failed',
          result.error || 'Failed to sign in with Google. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error signing in:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsSigningIn(false);
    }
  };

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={SCREEN_OPTIONS[colorScheme ?? 'light']} />
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator
            size="large"
            color={colorScheme === 'dark' ? '#fff' : '#000'}
          />
          <Text className="mt-4 text-muted-foreground">Loading...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={SCREEN_OPTIONS[colorScheme ?? 'light']} />
      <View className="flex-1 items-center justify-center gap-8 p-6 bg-background">
        {/* App Logo/Title */}
        <View className="items-center gap-4">
          <Text className="text-5xl font-bold text-foreground">Caeli</Text>
          <Text className="text-center text-lg text-muted-foreground">
            Welcome to Caeli
          </Text>
          <Text className="text-center text-sm text-muted-foreground px-8">
            Sign in with your Google account to get started
          </Text>
        </View>

        {/* Sign In Button */}
        <View className="w-full max-w-sm gap-4">
          <Button
            onPress={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full"
            size="lg"
          >
            {isSigningIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-lg font-semibold">Sign in with Google</Text>
            )}
          </Button>

          {isSigningIn && (
            <Text className="text-center text-sm text-muted-foreground">
              Opening Google sign in...
            </Text>
          )}
        </View>

        {/* Footer */}
        <View className="absolute bottom-8 items-center">
          <Text className="text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service
          </Text>
        </View>
      </View>
    </>
  );
}

const THEME_ICONS = {
  light: SunIcon,
  dark: MoonStarIcon,
};

function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <Button
      onPressIn={toggleColorScheme}
      size="icon"
      variant="ghost"
      className="rounded-full web:mx-4"
    >
      <Icon as={THEME_ICONS[colorScheme ?? 'light']} className="size-5" />
    </Button>
  );
}
