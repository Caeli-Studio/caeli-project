/**
 * Application configuration
 */

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
const LOCAL_IP_ADDRESS = '192.168.129.19';
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

// OAuth redirect URL for mobile app
export const OAUTH_REDIRECT_URL = 'caeli://auth/callback';

// Session refresh threshold (in seconds before expiry)
export const SESSION_REFRESH_THRESHOLD = 300; // Refresh 5 minutes before expiry
