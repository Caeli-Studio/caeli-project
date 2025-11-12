import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Session, User } from '@/types/auth';

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: '@caeli/access_token',
  REFRESH_TOKEN: '@caeli/refresh_token',
  USER: '@caeli/user',
  SESSION: '@caeli/session',
} as const;

/**
 * Storage service for managing authentication data
 */
export const storage = {
  /**
   * Save access token
   */
  async saveAccessToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } catch (error) {
      console.error('Error saving access token:', error);
      throw error;
    }
  },

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  /**
   * Save refresh token
   */
  async saveRefreshToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch (error) {
      console.error('Error saving refresh token:', error);
      throw error;
    }
  },

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  /**
   * Save user data
   */
  async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  },

  /**
   * Get user data
   */
  async getUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  /**
   * Save session data
   */
  async saveSession(session: Session): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      await this.saveAccessToken(session.access_token);
      await this.saveRefreshToken(session.refresh_token);
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  },

  /**
   * Get session data
   */
  async getSession(): Promise<Session | null> {
    try {
      const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  /**
   * Clear all authentication data
   */
  async clearAuth(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.SESSION,
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  },

  /**
   * Check if user is authenticated (has valid tokens)
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      const session = await this.getSession();

      if (!accessToken || !session) {
        return false;
      }

      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      return session.expires_at > now;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  },
};
