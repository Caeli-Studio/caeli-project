import {
  createGroup,
  deleteGroup,
  getGroup,
  getMyGroups,
  leaveGroup,
  updateGroup,
} from '../controllers/group.controller';
import {
  loadMembership,
  requirePermission,
  requireRole,
} from '../middleware/permissions';
import { verifyJWT } from '../utils/auth';
import { customLogger } from '../utils/logger';

import type { FastifyInstance } from 'fastify';

/**
 * Group routes
 */
export default async function groupRoutes(fastify: FastifyInstance) {
  fastify.post('/', {
    onRequest: [verifyJWT],
    handler: createGroup,
    schema: {
      tags: ['Groups'],
      summary: 'Create a new group',
      description:
        'Creates a new household group. The creator becomes the owner.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
        },
      },
      response: {
        201: {
          description: 'Group created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                group_id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                created_by: { type: 'string' },
                created_at: { type: 'string' },
                updated_at: { type: 'string' },
              },
            },
          },
        },
      },
    },
  });

  fastify.get('/', {
    onRequest: [verifyJWT],
    handler: getMyGroups,
    schema: {
      tags: ['Groups'],
      summary: 'Get my groups',
      description:
        'Retrieves all groups where the authenticated user is a member.',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'List of groups',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
  });

  fastify.get('/:group_id', {
    onRequest: [verifyJWT, loadMembership],
    handler: getGroup,
    schema: {
      tags: ['Groups'],
      summary: 'Get group details',
      description: 'Retrieves detailed information about a specific group.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['group_id'],
        properties: {
          group_id: { type: 'string', format: 'uuid', description: 'Group ID' },
        },
      },
      response: {
        200: {
          description: 'Group details',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
  });

  fastify.put('/:group_id', {
    onRequest: [verifyJWT, loadMembership, requirePermission('can_edit_group')],
    handler: updateGroup,
    schema: {
      tags: ['Groups'],
      summary: 'Update group',
      description: 'Updates group information. Requires admin or owner role.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['group_id'],
        properties: {
          group_id: { type: 'string', format: 'uuid', description: 'Group ID' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
        },
      },
      response: {
        200: {
          description: 'Group updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
  });

  fastify.delete('/:group_id', {
    onRequest: [verifyJWT, loadMembership, requireRole('owner')],
    handler: deleteGroup,
    schema: {
      tags: ['Groups'],
      summary: 'Delete group',
      description:
        'Permanently deletes a group. Only the owner can perform this action.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['group_id'],
        properties: {
          group_id: { type: 'string', format: 'uuid', description: 'Group ID' },
        },
      },
      response: {
        200: {
          description: 'Group deleted successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  });

  fastify.post('/:group_id/leave', {
    onRequest: [verifyJWT, loadMembership],
    handler: leaveGroup,
    schema: {
      tags: ['Groups'],
      summary: 'Leave group',
      description:
        'Leave a group. Owners cannot leave; they must transfer ownership first or delete the group.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['group_id'],
        properties: {
          group_id: { type: 'string', format: 'uuid', description: 'Group ID' },
        },
      },
      response: {
        200: {
          description: 'Left group successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  });

  // Log registered routes
  customLogger.route('POST', '/api/groups');
  customLogger.route('GET', '/api/groups');
  customLogger.route('GET', '/api/groups/:group_id');
  customLogger.route('PUT', '/api/groups/:group_id');
  customLogger.route('DELETE', '/api/groups/:group_id');
  customLogger.route('POST', '/api/groups/:group_id/leave');
}
