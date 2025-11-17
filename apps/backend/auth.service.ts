import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import type {
  AuthResponse,
  GoogleOAuthResponse,
  SessionResponse,
  SignOutResponse,
  Session,
  User,
} from '@/types/auth';

import {
  API_ENDPOINTS,
  SESSION_REFRESH_THRESHOLD,
  OAUTH_REDIRECT_URL,
} from '@/lib/config';
import { storage } from '@/lib/storage';

WebBrowser.maybeCompleteAuthSession();

/**
 * Authentication Service
 * Handles Google OAuth authentication and session management
 */
class AuthService {
  private refreshTokenTimeout?: ReturnType<typeof setTimeout>;

  /**
   * Initiate Google OAuth sign-in
   * Opens the OAuth flow in a browser and handles the callback
   */
  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      // Debug: Log the URL being called
      console.warn('Attempting to connect to:', API_ENDPOINTS.GOOGLE_AUTH);

      // Get the OAuth URL from the backend
      const response = await fetch(API_ENDPOINTS.GOOGLE_AUTH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redirectUrl: OAUTH_REDIRECT_URL,
        }),
      });

      const data: GoogleOAuthResponse = await response.json();

      if (!data.success || !data.url) {
        throw new Error(data.message || 'Failed to initiate Google sign-in');
      }

      // Debug logging for Android
      if (Platform.OS === 'android') {
        console.log('[Android OAuth Debug] Opening URL:', data.url);
        console.log('[Android OAuth Debug] Redirect URL:', OAUTH_REDIRECT_URL);
      }

      // Open the OAuth URL in a browser with Android-specific options
      const browserOptions: WebBrowser.WebBrowserOpenOptions = {
        showTitle: false,
        enableBarCollapsing: false,
        // For Android, ensure we use a browser that can redirect back
        ...(Platform.OS === 'android' && {
          showInRecents: true,
        }),
      };

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        OAUTH_REDIRECT_URL,
        browserOptions
      );

      // Debug logging for Android
      if (Platform.OS === 'android') {
        console.log('[Android OAuth Debug] Result type:', result.type);
        if (result.type === 'success') {
          console.log('[Android OAuth Debug] Result URL:', result.url);
        }
      }

      if (result.type !== 'success') {
        console.warn('Authentication result type:', result.type);
        throw new Error('Authentication was cancelled or failed');
      }

      // Parse the URL - Supabase returns tokens in hash fragment
      const url = new URL(result.url);

      // Check if we got tokens directly in the hash (PKCE flow)
      if (url.hash) {
        const hashParams = new URLSearchParams(url.hash.substring(1)); // Remove '#'
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
          // Parse the session from hash params
          const session = {
            access_token: accessToken,
            refresh_token: refreshToken || '',
            expires_in: parseInt(hashParams.get('expires_in') || '3600', 10),
            expires_at: parseInt(
              hashParams.get('expires_at') || String(Date.now() / 1000 + 3600),
              10
            ),
            token_type: hashParams.get('token_type') || 'bearer',
          };

          // Save session
          await storage.saveSession(session);

          // Get user info from the access token
          const userResponse = await this.getSession();

          if (userResponse.success && userResponse.user) {
            await storage.saveUser(userResponse.user);
            this.scheduleTokenRefresh(session);

            return {
              success: true,
              session,
              user: userResponse.user,
            };
          }
        }
      }

      // Otherwise, try to get authorization code (code flow)
      const code = url.searchParams.get('code');

      if (!code) {
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');

        throw new Error(
          errorDescription ||
            error ||
            'No authorization code or tokens received'
        );
      }

      // Exchange the code for a session
      const authResponse = await this.exchangeCodeForSession(code);

      if (authResponse.success && authResponse.session && authResponse.user) {
        // Save session and user data
        await storage.saveSession(authResponse.session);
        await storage.saveUser(authResponse.user);

        // Set up automatic token refresh
        this.scheduleTokenRefresh(authResponse.session);
      }

      return authResponse;
    } catch (error) {
      console.error('Error in signInWithGoogle:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Exchange authorization code for session
   */
  private async exchangeCodeForSession(code: string): Promise<AuthResponse> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.AUTH_CALLBACK}?code=${code}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data: AuthResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to exchange code for session');
      }

      return data;
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<SignOutResponse> {
    try {
      const accessToken = await storage.getAccessToken();

      if (!accessToken) {
        // Clear local storage even if no token
        await storage.clearAuth();
        this.cancelTokenRefresh();
        return {
          success: true,
          message: 'Signed out successfully',
        };
      }

      const response = await fetch(API_ENDPOINTS.SIGN_OUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data: SignOutResponse = await response.json();

      // Clear local storage regardless of API response
      await storage.clearAuth();
      this.cancelTokenRefresh();

      return data;
    } catch (error) {
      console.error('Error in signOut:', error);
      // Still clear local storage on error
      await storage.clearAuth();
      this.cancelTokenRefresh();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get current user session
   */
  async getSession(): Promise<SessionResponse> {
    try {
      const accessToken = await storage.getAccessToken();

      if (!accessToken) {
        return {
          success: false,
          error: 'No access token found',
        };
      }

      const response = await fetch(API_ENDPOINTS.GET_SESSION, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data: SessionResponse = await response.json();

      if (data.success && data.user) {
        await storage.saveUser(data.user);
      }

      return data;
    } catch (error) {
      console.error('Error in getSession:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Refresh user session/token
   */
  async refreshSession(): Promise<AuthResponse> {
    try {
      const refreshToken = await storage.getRefreshToken();

      if (!refreshToken) {
        console.error('No refresh token available - user needs to sign in');
        return {
          success: false,
          error: 'No refresh token found',
        };
      }

      const response = await fetch(API_ENDPOINTS.REFRESH_SESSION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.session && data.user) {
        // Save new session and user data
        await storage.saveSession(data.session);
        await storage.saveUser(data.user);

        // Reschedule token refresh
        this.scheduleTokenRefresh(data.session);
      } else {
        // Refresh failed, clear auth data
        console.error('Session refresh failed, clearing auth data');
        await storage.clearAuth();
      }

      return data;
    } catch (error) {
      console.error('Error in refreshSession:', error);
      // Clear auth data on error
      await storage.clearAuth();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(session: Session): void {
    // Cancel any existing refresh timeout
    this.cancelTokenRefresh();

    // Calculate when to refresh (before expiry)
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = session.expires_at - now;
    const refreshIn = Math.max(
      (expiresIn - SESSION_REFRESH_THRESHOLD) * 1000,
      0
    );

    // Schedule refresh
    this.refreshTokenTimeout = setTimeout(async () => {
      const result = await this.refreshSession();
      if (!result.success) {
        console.error('Auto-refresh failed:', result.error);
        // Clear auth data if refresh fails
        await storage.clearAuth();
      }
    }, refreshIn);
  }

  /**
   * Cancel scheduled token refresh
   */
  private cancelTokenRefresh(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = undefined;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await storage.isAuthenticated();
  }

  /**
   * Get current user from storage
   */
  async getCurrentUser(): Promise<User | null> {
    return await storage.getUser();
  }

  /**
   * Initialize auth service
   * Checks for existing session and sets up auto-refresh
   */
  async initialize(): Promise<void> {
    try {
      const isAuth = await this.isAuthenticated();

      if (isAuth) {
        const session = await storage.getSession();
        if (session) {
          // Check if session is still valid
          const now = Math.floor(Date.now() / 1000);
          if (session.expires_at > now) {
            // Set up auto-refresh for existing session
            this.scheduleTokenRefresh(session);
          } else {
            // Session expired, try to refresh
            await this.refreshSession();
          }
        }
      }
    } catch (error) {
      console.error('Error initializing auth service:', error);
    }
  }
}

export const authService = new AuthService();
