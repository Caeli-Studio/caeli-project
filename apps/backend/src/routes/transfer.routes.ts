import {
  acceptTransfer,
  cancelTransfer,
  createTransfer,
  getTransfer,
  getTransfers,
  refuseTransfer,
} from '../controllers/transfer.controller';
import { loadMembership } from '../middleware/permissions';
import { verifyJWT } from '../utils/auth';
import { customLogger } from '../utils/logger';

import type { FastifyInstance } from 'fastify';

/**
 * Task transfer routes
 */
export default async function transferRoutes(fastify: FastifyInstance) {
  fastify.post('/', {
    onRequest: [verifyJWT, loadMembership],
    schema: {
      tags: ['Transfers'],
      summary: 'Create transfer',
      description: 'Creates a task transfer/exchange request',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['task_id', 'to_membership_id'],
        properties: {
          task_id: { type: 'string', format: 'uuid' },
          to_membership_id: { type: 'string', format: 'uuid' },
          message: { type: 'string', maxLength: 500 },
        },
      },
      response: {
        201: {
          description: 'Transfer created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: createTransfer,
  });

  fastify.get('/', {
    onRequest: [verifyJWT, loadMembership],
    schema: {
      tags: ['Transfers'],
      summary: 'Get transfers',
      description: 'Retrieves task transfers for the group',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'accepted', 'refused', 'cancelled'],
          },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'integer', minimum: 0, default: 0 },
        },
      },
      response: {
        200: {
          description: 'List of transfers',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    handler: getTransfers,
  });

  fastify.get('/:transfer_id', {
    onRequest: [verifyJWT, loadMembership],
    schema: {
      tags: ['Transfers'],
      summary: 'Get transfer details',
      description: 'Retrieves details about a specific transfer',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['transfer_id'],
        properties: {
          transfer_id: {
            type: 'string',
            format: 'uuid',
            description: 'Transfer ID',
          },
        },
      },
      response: {
        200: {
          description: 'Transfer details',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: getTransfer,
  });

  fastify.post('/:transfer_id/accept', {
    onRequest: [verifyJWT, loadMembership],
    schema: {
      tags: ['Transfers'],
      summary: 'Accept transfer',
      description: 'Accepts a task transfer request',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['transfer_id'],
        properties: {
          transfer_id: {
            type: 'string',
            format: 'uuid',
            description: 'Transfer ID',
          },
        },
      },
      response: {
        200: {
          description: 'Transfer accepted successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: acceptTransfer,
  });

  fastify.post('/:transfer_id/refuse', {
    onRequest: [verifyJWT, loadMembership],
    schema: {
      tags: ['Transfers'],
      summary: 'Refuse transfer',
      description: 'Refuses a task transfer request',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['transfer_id'],
        properties: {
          transfer_id: {
            type: 'string',
            format: 'uuid',
            description: 'Transfer ID',
          },
        },
      },
      response: {
        200: {
          description: 'Transfer refused successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: refuseTransfer,
  });

  fastify.delete('/:transfer_id', {
    onRequest: [verifyJWT, loadMembership],
    schema: {
      tags: ['Transfers'],
      summary: 'Cancel transfer',
      description: 'Cancels a pending transfer request',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['transfer_id'],
        properties: {
          transfer_id: {
            type: 'string',
            format: 'uuid',
            description: 'Transfer ID',
          },
        },
      },
      response: {
        200: {
          description: 'Transfer cancelled successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: cancelTransfer,
  });

  // Log registered routes
  customLogger.route('POST', '/api/groups/:group_id/transfers');
  customLogger.route('GET', '/api/groups/:group_id/transfers');
  customLogger.route('GET', '/api/groups/:group_id/transfers/:transfer_id');
  customLogger.route(
    'POST',
    '/api/groups/:group_id/transfers/:transfer_id/accept'
  );
  customLogger.route(
    'POST',
    '/api/groups/:group_id/transfers/:transfer_id/refuse'
  );
  customLogger.route('DELETE', '/api/groups/:group_id/transfers/:transfer_id');
}
