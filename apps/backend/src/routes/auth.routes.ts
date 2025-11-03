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
      tags: ['Authentication'],
      summary: 'Initiate Google OAuth',
      description:
        'Initiates Google OAuth sign-in flow and returns the authorization URL',
      body: {
        type: 'object',
        properties: {
          redirectUrl: { type: 'string' },
        },
      },
      response: {
        200: {
          description: 'OAuth URL generated successfully',
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
      tags: ['Authentication'],
      summary: 'OAuth callback',
      description:
        'Handles OAuth callback from Google with authorization code or error',
      querystring: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          error: { type: 'string' },
          error_description: { type: 'string' },
        },
      },
      response: {
        200: {
          description: 'Authentication successful',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            session: { type: 'object' },
            user: { type: 'object' },
          },
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
      tags: ['Authentication'],
      summary: 'Sign out',
      description: 'Signs out the current user and invalidates the session',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Signed out successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
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
      tags: ['Authentication'],
      summary: 'Get session',
      description: 'Retrieves the current user session information',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Session retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: { type: 'object' },
          },
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
      tags: ['Authentication'],
      summary: 'Refresh session',
      description: 'Refreshes the user session using a refresh token',
      body: {
        type: 'object',
        required: ['refresh_token'],
        properties: {
          refresh_token: { type: 'string' },
        },
      },
      response: {
        200: {
          description: 'Session refreshed successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            session: { type: 'object' },
            user: { type: 'object' },
          },
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
