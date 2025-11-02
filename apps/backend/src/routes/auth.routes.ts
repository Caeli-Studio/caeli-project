import {
  getSession,
  handleOAuthCallback,
  refreshSession,
  signInWithGoogle,
  signOut,
} from '../controllers/auth.controller';
import { verifyJWT } from '../utils/auth';
import { customLogger } from '../utils/logger';

import type { FastifyInstance } from 'fastify';

/**
 * Authentication routes
 * Handles Google OAuth authentication
 */
export default async function authRoutes(fastify: FastifyInstance) {
  /**
   * Initiate Google sign-in
   * POST /api/auth/google
   *
   * Body: { redirectUrl?: string }
   * Returns: { success: true, url: string, provider: string }
   */
  fastify.post('/google', {
    schema: {
      description: 'Initiate Google OAuth sign-in',
      tags: ['auth'],
      body: {
        type: 'object',
        properties: {
          redirectUrl: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            url: { type: 'string' },
            provider: { type: 'string' },
          },
        },
      },
    },
    handler: signInWithGoogle,
  });

  /**
   * Handle OAuth callback
   * GET /api/auth/callback
   *
   * Query: { code: string } or { error: string, error_description: string }
   * Returns: { success: true, session: {...}, user: {...} }
   */
  fastify.get('/callback', {
    schema: {
      description: 'Handle OAuth callback from Google',
      tags: ['auth'],
      querystring: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          error: { type: 'string' },
          error_description: { type: 'string' },
        },
      },
    },
    handler: handleOAuthCallback,
  });

  /**
   * Sign out current user
   * POST /api/auth/signout
   *
   * Requires: Authorization header with Bearer token
   * Returns: { success: true, message: string }
   */
  fastify.post('/signout', {
    schema: {
      description: 'Sign out the current user',
      tags: ['auth'],
      headers: {
        type: 'object',
        required: ['authorization'],
        properties: {
          authorization: { type: 'string' },
        },
      },
    },
    handler: signOut,
  });

  /**
   * Get current user session
   * GET /api/auth/session
   *
   * Requires: Authorization header with Bearer token
   * Returns: { success: true, user: {...} }
   */
  fastify.get('/session', {
    onRequest: [verifyJWT],
    schema: {
      description: 'Get current user session',
      tags: ['auth'],
      headers: {
        type: 'object',
        required: ['authorization'],
        properties: {
          authorization: { type: 'string' },
        },
      },
    },
    handler: getSession,
  });

  /**
   * Refresh user session
   * POST /api/auth/refresh
   *
   * Body: { refresh_token: string }
   * Returns: { success: true, session: {...}, user: {...} }
   */
  fastify.post('/refresh', {
    schema: {
      description: 'Refresh user session',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['refresh_token'],
        properties: {
          refresh_token: { type: 'string' },
        },
      },
    },
    handler: refreshSession,
  });

  // Log registered routes
  customLogger.route('POST', '/api/auth/google');
  customLogger.route('GET', '/api/auth/callback');
  customLogger.route('POST', '/api/auth/signout');
  customLogger.route('GET', '/api/auth/session');
  customLogger.route('POST', '/api/auth/refresh');
}
