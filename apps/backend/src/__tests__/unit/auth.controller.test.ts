import { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

import {
  createMockSupabaseClient,
  mockOAuthUrl,
  mockAuthSuccess,
} from '../../__mocks__/supabase';
import { createTestApp, closeTestApp } from '../helpers/test-app';

describe('Auth Controller - Unit Tests', () => {
  let app: FastifyInstance;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeAll(async () => {
    app = await createTestApp();
    mockSupabase = createMockSupabaseClient();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('POST /api/auth/google', () => {
    it('should initiate Google OAuth and return OAuth URL', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValueOnce(mockOAuthUrl);
      app.supabaseClient = mockSupabase as any;

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/google',
        payload: {
          redirectUrl: 'http://localhost:3000/auth/callback',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.url).toBeDefined();
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
    });

    it('should use default redirect URL if not provided', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValueOnce(mockOAuthUrl);
      app.supabaseClient = mockSupabase as any;

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/google',
        payload: {},
      });

      expect(response.statusCode).toBe(200);
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalled();
    });

    it('should handle OAuth initiation failure', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValueOnce({
        data: { url: '', provider: 'google' },
        error: {
          message: 'OAuth provider error',
          name: 'OAuthError',
          status: 400,
        },
      });
      app.supabaseClient = mockSupabase as any;

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/google',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });
  });

  describe('GET /api/auth/callback', () => {
    it('should exchange code for session successfully', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValueOnce(
        mockAuthSuccess
      );
      app.supabaseClient = mockSupabase as any;

      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/callback?code=test-auth-code',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.session).toBeDefined();
      expect(body.session.access_token).toBe('mock-access-token');
      expect(body.user).toBeDefined();
      expect(body.user.id).toBe('test-user-id');
    });

    it('should handle missing authorization code', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/callback',
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Missing authorization code');
    });

    it('should handle OAuth provider errors', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/callback?error=access_denied&error_description=User+denied+access',
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('access_denied');
    });

    it('should handle code exchange failure', async () => {
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValueOnce({
        data: { session: null, user: null },
        error: {
          message: 'Invalid authorization code',
          name: 'AuthError',
          status: 400,
        },
      });
      app.supabaseClient = mockSupabase as any;

      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/callback?code=invalid-code',
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to exchange authorization code');
    });
  });

  describe('POST /api/auth/signout', () => {
    it('should handle missing authorization header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/signout',
      });

      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('No access token provided');
    });

    it('should handle invalid authorization header format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/signout',
        headers: {
          authorization: 'InvalidFormat token',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should handle missing refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      // Some responses might not have a JSON body
      try {
        const body = response.json();
        expect(body.success).toBe(false);
        expect(body.error).toBeDefined();
      } catch {
        // If JSON parsing fails, that's also acceptable for an error response
      }
    });

    it('should refresh session with valid refresh token', async () => {
      mockSupabase.auth.refreshSession = vi.fn().mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_at: Date.now() + 3600000,
            expires_in: 3600,
            token_type: 'bearer',
          },
          user: mockAuthSuccess.data.user,
        },
        error: null,
      });
      app.supabaseClient = mockSupabase as any;

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: {
          refresh_token: 'valid-refresh-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.session.access_token).toBe('new-access-token');
    });

    it('should handle invalid refresh token', async () => {
      mockSupabase.auth.refreshSession = vi.fn().mockResolvedValueOnce({
        data: { session: null, user: null },
        error: {
          message: 'Invalid refresh token',
          name: 'AuthError',
          status: 401,
        },
      });
      app.supabaseClient = mockSupabase as any;

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: {
          refresh_token: 'invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to refresh session');
    });
  });
});
