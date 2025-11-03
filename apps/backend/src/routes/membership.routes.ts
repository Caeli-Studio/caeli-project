import {
  getMember,
  getMembers,
  inviteMember,
  removeMember,
  updateMember,
} from '../controllers/membership.controller';
import { loadMembership, requirePermission } from '../middleware/permissions';
import { verifyJWT } from '../utils/auth';
import { customLogger } from '../utils/logger';

import type { FastifyInstance } from 'fastify';

/**
 * Membership routes
 */
export default async function membershipRoutes(fastify: FastifyInstance) {
  fastify.get('/', {
    onRequest: [verifyJWT, loadMembership],
    schema: {
      tags: ['Memberships'],
      summary: 'Get members',
      description: 'Retrieves all members of the group',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'List of members',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    handler: getMembers,
  });

  fastify.get('/:membership_id', {
    onRequest: [verifyJWT, loadMembership],
    schema: {
      tags: ['Memberships'],
      summary: 'Get member details',
      description: 'Retrieves details about a specific member',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['membership_id'],
        properties: {
          membership_id: {
            type: 'string',
            format: 'uuid',
            description: 'Membership ID',
          },
        },
      },
      response: {
        200: {
          description: 'Member details',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: getMember,
  });

  fastify.post('/invite', {
    onRequest: [
      verifyJWT,
      loadMembership,
      requirePermission('can_manage_members'),
    ],
    schema: {
      tags: ['Memberships'],
      summary: 'Invite member',
      description: 'Invites a user to join the group',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['email', 'role'],
        properties: {
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['admin', 'member', 'child', 'guest'] },
        },
      },
      response: {
        201: {
          description: 'Member invited successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: inviteMember,
  });

  fastify.put('/:membership_id', {
    onRequest: [
      verifyJWT,
      loadMembership,
      requirePermission('can_manage_members'),
    ],
    schema: {
      tags: ['Memberships'],
      summary: 'Update member',
      description: "Updates a member's role or other properties",
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['membership_id'],
        properties: {
          membership_id: {
            type: 'string',
            format: 'uuid',
            description: 'Membership ID',
          },
        },
      },
      body: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['admin', 'member', 'child', 'guest'] },
        },
      },
      response: {
        200: {
          description: 'Member updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: updateMember,
  });

  fastify.delete('/:membership_id', {
    onRequest: [
      verifyJWT,
      loadMembership,
      requirePermission('can_manage_members'),
    ],
    schema: {
      tags: ['Memberships'],
      summary: 'Remove member',
      description: 'Removes a member from the group',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['membership_id'],
        properties: {
          membership_id: {
            type: 'string',
            format: 'uuid',
            description: 'Membership ID',
          },
        },
      },
      response: {
        200: {
          description: 'Member removed successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: removeMember,
  });

  // Log registered routes
  customLogger.route('GET', '/api/groups/:group_id/members');
  customLogger.route('GET', '/api/groups/:group_id/members/:membership_id');
  customLogger.route('POST', '/api/groups/:group_id/members/invite');
  customLogger.route('PUT', '/api/groups/:group_id/members/:membership_id');
  customLogger.route('DELETE', '/api/groups/:group_id/members/:membership_id');
}
