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
  getOAuthRedirectUrl,
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
   */
  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      const redirectUrl = getOAuthRedirectUrl();

      const response = await fetch(API_ENDPOINTS.GOOGLE_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirectUrl }),
      });

      const data: GoogleOAuthResponse = await response.json();

      if (!data.success || !data.url) {
        throw new Error(data.message || 'Failed to initiate Google sign-in');
      }

      const browserOptions: WebBrowser.WebBrowserOpenOptions = {
        showTitle: false,
        enableBarCollapsing: false,
        ...(Platform.OS === 'android' && { showInRecents: true }),
      };

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
        browserOptions
      );

      if (result.type !== 'success') {
        throw new Error('Authentication was cancelled or failed');
      }

      const url = new URL(result.url);

      // Token-in-hash (Supabase PKCE flow)
      if (url.hash) {
        const hashParams = new URLSearchParams(url.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
          const session: Session = {
            access_token: accessToken,
            refresh_token: refreshToken || '',
            expires_in: Number(hashParams.get('expires_in') || '3600'),
            expires_at: Number(
              hashParams.get('expires_at') || String(Date.now() / 1000 + 3600)
            ),
            token_type: hashParams.get('token_type') || 'bearer',
          };

          await storage.saveSession(session);

          const userResponse = await this.getSession();
          if (!userResponse.success || !userResponse.user) {
            throw new Error('Failed to load user session');
          }

          await storage.saveUser(userResponse.user);
          this.scheduleTokenRefresh(session);

          return {
            success: true,
            session,
            user: userResponse.user,
          };
        }
      }

      // Code flow
      const code = url.searchParams.get('code');
      if (!code) {
        throw new Error('No authorization code or tokens received');
      }

      const authResponse = await this.exchangeCodeForSession(code);

      if (authResponse.success && authResponse.session && authResponse.user) {
        await storage.saveSession(authResponse.session);
        await storage.saveUser(authResponse.user);
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
   * Update username (profile update)
   */
  async updateUserName(newNickname: string): Promise<AuthResponse> {
    try {
      const accessToken = await storage.getAccessToken();

      console.log('🔹 Calling:', API_ENDPOINTS.UPDATE_USERNAME);
      console.log('🔹 Token:', accessToken);
      console.log('🔹 Body sent:', { display_name: newNickname });

      const response = await fetch(API_ENDPOINTS.UPDATE_USERNAME, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          display_name: newNickname,
        }),
      });

      const data = await response.json();

      console.log('🔹 Status:', response.status);
      console.log('🔹 Raw response:', data);

      // Vérifie la réponse
      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Update failed' };
      }

      // 💡 Ton backend renvoie { success, profile }
      const profile = data.profile;

      return {
        success: true,
        user: {
          id: profile.user_id,
          name: profile.display_name,
          email: null, // ton backend ne renvoie pas email
          avatar: profile.avatar_url,
        },
      };
    } catch (error) {
      console.error('❌ Error updating username:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Exchange authorization code for session
   */
  private async exchangeCodeForSession(code: string): Promise<AuthResponse> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.AUTH_CALLBACK}?code=${code}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
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
   * Sign out
   */
  async signOut(): Promise<SignOutResponse> {
    try {
      const accessToken = await storage.getAccessToken();

      const response = await fetch(API_ENDPOINTS.SIGN_OUT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data: SignOutResponse = await response.json();

      await storage.clearAuth();
      this.cancelTokenRefresh();

      return data;
    } catch (error) {
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
      if (!accessToken)
        return { success: false, error: 'No access token found' };

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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(): Promise<AuthResponse> {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken)
        return { success: false, error: 'No refresh token found' };

      const response = await fetch(API_ENDPOINTS.REFRESH_SESSION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.session && data.user) {
        await storage.saveSession(data.session);
        await storage.saveUser(data.user);
        this.scheduleTokenRefresh(data.session);
      } else {
        await storage.clearAuth();
      }

      return data;
    } catch (error) {
      await storage.clearAuth();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Schedule token refresh before expiry
   */
  private scheduleTokenRefresh(session: Session): void {
    this.cancelTokenRefresh();

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = session.expires_at - now;
    const refreshIn = Math.max(
      (expiresIn - SESSION_REFRESH_THRESHOLD) * 1000,
      0
    );

    this.refreshTokenTimeout = setTimeout(async () => {
      const result = await this.refreshSession();
      if (!result.success) await storage.clearAuth();
    }, refreshIn);
  }

  private cancelTokenRefresh(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = undefined;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return storage.isAuthenticated();
  }

  async getCurrentUser(): Promise<User | null> {
    return storage.getUser();
  }

  async initialize(): Promise<void> {
    try {
      if (await this.isAuthenticated()) {
        const session = await storage.getSession();
        if (session) {
          const now = Math.floor(Date.now() / 1000);
          if (session.expires_at > now) {
            this.scheduleTokenRefresh(session);
          } else {
            await this.refreshSession();
          }
        }
      }
    } catch (err) {
      console.error('Error initializing auth service:', err);
    }
  }
}

export const authService = new AuthService();
