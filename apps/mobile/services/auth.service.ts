import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import type {
  AuthResponse,
  GoogleOAuthResponse,
  SessionResponse,
  SignOutResponse,
  Session,
  User,
} from '@/types/auth';

import { API_ENDPOINTS, SESSION_REFRESH_THRESHOLD } from '@/lib/config';
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
      // Get the OAuth URL from the backend
      const response = await fetch(API_ENDPOINTS.GOOGLE_AUTH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redirectUrl: makeRedirectUri({
            scheme: 'caeli',
            path: 'auth/callback',
          }),
        }),
      });

      const data: GoogleOAuthResponse = await response.json();

      if (!data.success || !data.url) {
        throw new Error(data.message || 'Failed to initiate Google sign-in');
      }

      // Open the OAuth URL in a browser
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        makeRedirectUri({
          scheme: 'caeli',
          path: 'auth/callback',
        })
      );

      if (result.type !== 'success') {
        throw new Error('Authentication was cancelled or failed');
      }

      // Extract the authorization code from the callback URL
      const url = new URL(result.url);
      const code = url.searchParams.get('code');

      if (!code) {
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');
        throw new Error(
          errorDescription || error || 'No authorization code received'
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
      }

      return data;
    } catch (error) {
      console.error('Error in refreshSession:', error);
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
