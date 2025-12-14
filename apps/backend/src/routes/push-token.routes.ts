/**
 * Push Token Routes
 *
 * Routes for managing Expo push notification tokens
 */

import { FastifyInstance } from 'fastify';

import {
  registerPushToken,
  deletePushToken,
} from '../controllers/push-token.controller.js';

/**
 * Register push token routes
 *
 * POST /api/push-token - Register a new push token
 * DELETE /api/push-token - Delete an existing push token
 *
 * @param app - Fastify instance
 */
export async function pushTokenRoutes(app: FastifyInstance) {
  // Register a new push token
  app.post('/push-token', {
    schema: {
      description: 'Register Expo push notification token for current user',
      tags: ['push-tokens'],
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: {
            type: 'string',
            description: 'Expo push notification token',
            examples: ['ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'],
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
          },
        },
      },
    },
    handler: registerPushToken,
  });

  // Delete an existing push token
  app.delete('/push-token', {
    schema: {
      description: 'Delete Expo push notification token for current user',
      tags: ['push-tokens'],
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: {
            type: 'string',
            description: 'Expo push notification token to delete',
            examples: ['ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'],
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
          },
        },
      },
    },
    handler: deletePushToken,
  });
}
