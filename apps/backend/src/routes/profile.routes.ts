import {
  createProfile,
  getMyProfile,
  getUserProfile,
  updateMyProfile,
} from '../controllers/profile.controller';
import { verifyJWT } from '../utils/auth';
import { customLogger } from '../utils/logger';

import type { FastifyInstance } from 'fastify';

/**
 * Profile routes
 */
export default async function profileRoutes(fastify: FastifyInstance) {
  fastify.get('/me', {
    onRequest: [verifyJWT],
    schema: {
      tags: ['Profile'],
      summary: 'Get my profile',
      description: "Retrieves the authenticated user's profile information",
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Profile retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: getMyProfile,
  });

  fastify.put('/me', {
    onRequest: [verifyJWT],
    schema: {
      tags: ['Profile'],
      summary: 'Update my profile',
      description: "Updates the authenticated user's profile information",
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          display_name: { type: 'string', minLength: 1, maxLength: 100 },
          avatar_url: { type: 'string' },
          pin: { type: 'string', minLength: 4, maxLength: 6 },
        },
      },
      response: {
        200: {
          description: 'Profile updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: updateMyProfile,
  });

  fastify.post('/', {
    onRequest: [verifyJWT],
    schema: {
      tags: ['Profile'],
      summary: 'Create profile',
      description: 'Creates a new user profile',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['display_name', 'pin'],
        properties: {
          display_name: { type: 'string', minLength: 1, maxLength: 100 },
          avatar_url: { type: 'string' },
          pin: { type: 'string', minLength: 4, maxLength: 6 },
        },
      },
      response: {
        201: {
          description: 'Profile created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: createProfile,
  });

  fastify.get('/:user_id', {
    onRequest: [verifyJWT],
    schema: {
      tags: ['Profile'],
      summary: 'Get user profile',
      description: "Retrieves another user's profile by their user ID",
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['user_id'],
        properties: {
          user_id: { type: 'string', format: 'uuid', description: 'User ID' },
        },
      },
      response: {
        200: {
          description: 'Profile retrieved successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: getUserProfile,
  });

  // Log registered routes
  customLogger.route('GET', '/api/profile/me');
  customLogger.route('PUT', '/api/profile/me');
  customLogger.route('POST', '/api/profile');
  customLogger.route('GET', '/api/profile/:user_id');
}
