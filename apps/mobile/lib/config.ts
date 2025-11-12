/**
 * Application configuration
 */

// Backend API URL - Update this to match your backend server
export const API_BASE_URL = __DEV__
  ? 'http://localhost:8000' // Development
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
