import {
  connectToHub,
  createHubSession,
  disconnectFromHub,
  getHubStatus,
} from '../controllers/hub.controller';
import { loadMembership } from '../middleware/permissions';
import { verifyJWT } from '../utils/auth';
import { customLogger } from '../utils/logger';

import type { FastifyInstance } from 'fastify';

/**
 * Hub/Monitor session routes
 */
export default async function hubRoutes(fastify: FastifyInstance) {
  fastify.post('/session', {
    onRequest: [verifyJWT, loadMembership],
    schema: {
      tags: ['Hub'],
      summary: 'Create hub session',
      description:
        'Creates a new hub/monitor session and generates a connection code',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['device_name'],
        properties: {
          device_name: { type: 'string', maxLength: 100 },
        },
      },
      response: {
        201: {
          description: 'Hub session created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: createHubSession,
  });

  fastify.post('/connect', {
    schema: {
      tags: ['Hub'],
      summary: 'Connect to hub',
      description:
        'Connects to a hub session using the session code and user PIN',
      body: {
        type: 'object',
        required: ['code', 'pin'],
        properties: {
          code: { type: 'string' },
          pin: { type: 'string', minLength: 4, maxLength: 6 },
        },
      },
      response: {
        200: {
          description: 'Connected to hub successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: connectToHub,
  });

  fastify.post('/disconnect', {
    schema: {
      tags: ['Hub'],
      summary: 'Disconnect from hub',
      description: 'Disconnects from the current hub session',
      body: {
        type: 'object',
        required: ['session_id'],
        properties: {
          session_id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          description: 'Disconnected successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: disconnectFromHub,
  });

  fastify.get('/status', {
    onRequest: [verifyJWT, loadMembership],
    schema: {
      tags: ['Hub'],
      summary: 'Get hub status',
      description: 'Retrieves the current status of the hub session',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Hub status',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: getHubStatus,
  });

  // Log registered routes
  customLogger.route('POST', '/api/groups/:group_id/hub/session');
  customLogger.route('POST', '/api/groups/:group_id/hub/connect');
  customLogger.route('POST', '/api/groups/:group_id/hub/disconnect');
  customLogger.route('GET', '/api/groups/:group_id/hub/status');
}
