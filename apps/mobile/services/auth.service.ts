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

class AuthService {
  private refreshTokenTimeout?: ReturnType<typeof setTimeout>;

  /**
   * Normalize a user object to always respect display_name > name
   */
  private normalize(user: any): User {
    return {
      id: user.id,
      email: user.email ?? null,
      display_name: user.display_name ?? user.name ?? null,
      name: user.display_name ?? user.name ?? null,
      avatar: user.avatar ?? null,
      provider: user.provider ?? null,
    };
  }

  /**
   * Google OAuth sign-in
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

      // Token-in-hash flow
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

          const normalized = this.normalize(userResponse.user);
          await storage.saveUser(normalized);

          this.scheduleTokenRefresh(session);

          return {
            success: true,
            session,
            user: normalized,
          };
        }
      }

      // Code flow
      const code = url.searchParams.get('code');
      if (!code) throw new Error('No authorization code received');

      const authResponse = await this.exchangeCodeForSession(code);

      if (authResponse.success && authResponse.session && authResponse.user) {
        const normalized = this.normalize(authResponse.user);
        await storage.saveSession(authResponse.session);
        await storage.saveUser(normalized);

        this.scheduleTokenRefresh(authResponse.session);

        return { ...authResponse, user: normalized };
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
   * Update username
   */
  async updateUserName(newNickname: string): Promise<AuthResponse> {
    try {
      const accessToken = await storage.getAccessToken();

      const response = await fetch(API_ENDPOINTS.UPDATE_USERNAME, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ display_name: newNickname }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Update failed' };
      }

      const profile = data.profile;

      const normalizedUser: User = {
        id: profile.user_id,
        display_name: profile.display_name,
        name: profile.display_name,
        email: null,
        avatar: profile.avatar_url,
      };

      return {
        success: true,
        user: normalizedUser,
      };
    } catch (error) {
      console.error('❌ Error updating username:', error);
      return { success: false, error: 'Network error' };
    }
  }

  private async exchangeCodeForSession(code: string): Promise<AuthResponse> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.AUTH_CALLBACK}?code=${code}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
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
   * Get current session
   */
  async getSession(): Promise<SessionResponse> {
    try {
      const accessToken = await storage.getAccessToken();
      if (!accessToken) return { success: false, error: 'No access token found' };

      const response = await fetch(API_ENDPOINTS.GET_SESSION, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data: SessionResponse = await response.json();

      if (data.success && data.user) {
        const normalized = this.normalize(data.user);
        await storage.saveUser(normalized);
        return { ...data, user: normalized };
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
 * Update avatar: upload base64 image → backend returns URL → update user
 */
  async updateAvatar(base64Image: string): Promise<AuthResponse> {
    try {
      const accessToken = await storage.getAccessToken();

      const response = await fetch(API_ENDPOINTS.UPDATE_AVATAR, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          avatar_base64: base64Image,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, error: data.error || "Avatar update failed" };
      }

      const updatedUser: User = {
        id: data.profile.user_id,
        email: null,
        display_name: data.profile.display_name,
        name: data.profile.display_name,
        avatar: data.avatar_url, // 🔥 URL finale renvoyée par le backend
        provider: null,
      };

      // 👉 Sauvegarde locale
      await storage.saveUser(updatedUser);

      return {
        success: true,
        user: updatedUser,
      };
    } catch (error) {
      console.error("❌ Error updating avatar:", error);
      return { success: false, error: "Network error" };
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
        const normalized = this.normalize(data.user);
        await storage.saveSession(data.session);
        await storage.saveUser(normalized);
        this.scheduleTokenRefresh(data.session);

        return { ...data, user: normalized };
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
