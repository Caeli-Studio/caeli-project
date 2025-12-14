/**
 * Application configuration
 */

import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/**
 * IMPORTANT: Network Configuration
 *
 * For Android Emulator: Uses 10.0.2.2 (special alias for host machine)
 * For iOS Simulator: Uses localhost
 * For Physical Devices: Update LOCAL_IP_ADDRESS to your computer's IP
 *
 * To find your IP address on macOS:
 * - Run: ifconfig | grep "inet " | grep -v 127.0.0.1
 * - Or: System Settings > Network > Your Connection > IP Address
 *
 * Current detected IP: 172.20.10.11
 */

// Update this if testing on a physical device
const LOCAL_IP_ADDRESS = '192.168.0.9';
const BACKEND_PORT = '3000';

/**
 * Get the local development URL based on platform
 */
const getDevApiUrl = () => {
  // For Android emulator, use the special IP that routes to host machine
  if (Platform.OS === 'android') {
    // Uncomment the next line if using Android emulator
    // return `http://10.0.2.2:${BACKEND_PORT}`;

    // For physical Android device, use your computer's IP
    return `http://${LOCAL_IP_ADDRESS}:${BACKEND_PORT}`;
  }

  // For iOS simulator, localhost works fine
  if (Platform.OS === 'ios') {
    // Uncomment the next line if using physical iOS device
    // return `http://${LOCAL_IP_ADDRESS}:${BACKEND_PORT}`;

    // Use 127.0.0.1 instead of localhost for better compatibility
    return `http://${LOCAL_IP_ADDRESS}:${BACKEND_PORT}`;
  }

  // Fallback
  return `http://${LOCAL_IP_ADDRESS}:${BACKEND_PORT}`;
};

// Backend API URL
export const API_BASE_URL = __DEV__
  ? getDevApiUrl()
  : 'https://your-production-api.com'; // Production

export const API_ENDPOINTS = {
  // Auth endpoints
  GOOGLE_AUTH: `${API_BASE_URL}/api/auth/google`,
  AUTH_CALLBACK: `${API_BASE_URL}/api/auth/callback`,
  SIGN_OUT: `${API_BASE_URL}/api/auth/signout`,
  GET_SESSION: `${API_BASE_URL}/api/auth/session`,
  REFRESH_SESSION: `${API_BASE_URL}/api/auth/refresh`,
} as const;

/**
 * Get OAuth redirect URL based on environment
 *
 * CRITICAL FOR ANDROID EXPO GO:
 * - Expo Go requires using Expo's auth proxy redirect URL
 * - Custom schemes (caeli://) only work in standalone builds
 * - iOS can handle both, but Android in Expo Go requires the proxy
 */
export const getOAuthRedirectUrl = (): string => {
  // Check if running in Expo Go (development)
  const isExpoGo = Constants.appOwnership === 'expo';

  if (isExpoGo) {
    // Use Expo's auth session redirect for Expo Go
    // This creates a URL like: https://auth.expo.io/@your-username/your-app
    return Linking.createURL('auth/callback', {
      scheme: 'caeli',
    });
  }

  // For standalone builds, use custom scheme
  return 'caeli://auth/callback';
};

// OAuth redirect URL for mobile app (deprecated - use getOAuthRedirectUrl())
export const OAUTH_REDIRECT_URL = getOAuthRedirectUrl();

// Session refresh threshold (in seconds before expiry)
export const SESSION_REFRESH_THRESHOLD = 300; // Refresh 5 minutes before expiry

// Supabase Configuration (for real-time notifications)
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
export const EXPO_PROJECT_ID = process.env.EXPO_PUBLIC_PROJECT_ID || '';
