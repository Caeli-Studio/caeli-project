import {
  acceptInvitation,
  createInvitation,
  getInvitation,
  listInvitations,
  revokeInvitation,
} from '../controllers/invitation.controller';
import { loadMembership, requirePermission } from '../middleware/permissions';
import { verifyJWT } from '../utils/auth';
import { customLogger } from '../utils/logger';

import type { FastifyInstance } from 'fastify';

/**
 * Invitation routes
 */
export default async function invitationRoutes(fastify: FastifyInstance) {
  // Create invitation (requires can_manage_members permission)
  fastify.post('/groups/:group_id/invitations', {
    onRequest: [
      verifyJWT,
      loadMembership,
      requirePermission('can_manage_members'),
    ],
    schema: {
      tags: ['Invitations'],
      summary: 'Create invitation',
      description:
        'Creates a new invitation for a group (QR code or pseudo-based)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['group_id'],
        properties: {
          group_id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['type'],
        properties: {
          type: {
            type: 'string',
            enum: ['qr', 'pseudo'],
            description: 'Type of invitation (QR code or pseudo)',
          },
          pseudo: {
            type: 'string',
            pattern: '^[a-zA-Z0-9_]{3,20}$',
            description: 'Pseudo of user to invite (required if type=pseudo)',
          },
          expires_in_hours: {
            type: 'number',
            minimum: 1,
            maximum: 720,
            default: 24,
            description: 'Hours until invitation expires (default: 24)',
          },
          max_uses: {
            type: 'number',
            minimum: 1,
            maximum: 100,
            default: 1,
            description: 'Maximum number of uses (default: 1)',
          },
        },
      },
      response: {
        201: {
          description: 'Invitation created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            invitation: { type: 'object' },
          },
        },
      },
    },
    handler: createInvitation,
  });

  // Get invitation details (public endpoint)
  fastify.get('/invitations/:code_or_pseudo', {
    schema: {
      tags: ['Invitations'],
      summary: 'Get invitation details',
      description:
        'Retrieves invitation details by code or pseudo (public endpoint)',
      params: {
        type: 'object',
        required: ['code_or_pseudo'],
        properties: {
          code_or_pseudo: {
            type: 'string',
            description: 'Invitation code or pseudo',
          },
        },
      },
      response: {
        200: {
          description: 'Invitation details',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            invitation: { type: 'object' },
          },
        },
      },
    },
    handler: getInvitation,
  });

  // Accept invitation
  fastify.post('/invitations/:code_or_pseudo/accept', {
    onRequest: [verifyJWT],
    schema: {
      tags: ['Invitations'],
      summary: 'Accept invitation',
      description: 'Accepts an invitation and joins the group',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['code_or_pseudo'],
        properties: {
          code_or_pseudo: {
            type: 'string',
            description: 'Invitation code or pseudo',
          },
        },
      },
      body: {
        type: 'object',
        properties: {
          code_or_pseudo: {
            type: 'string',
            description: 'Confirmation of code or pseudo',
          },
        },
      },
      response: {
        200: {
          description: 'Successfully joined the group',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            membership: { type: 'object' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: acceptInvitation,
  });

  // List invitations for a group
  fastify.get('/groups/:group_id/invitations', {
    onRequest: [verifyJWT, loadMembership],
    schema: {
      tags: ['Invitations'],
      summary: 'List group invitations',
      description: 'Lists all active invitations for a group',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['group_id'],
        properties: {
          group_id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          description: 'List of invitations',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            invitations: { type: 'array', items: { type: 'object' } },
            total: { type: 'number' },
          },
        },
      },
    },
    handler: listInvitations,
  });

  // Revoke invitation
  fastify.delete('/groups/:group_id/invitations/:invitation_id', {
    onRequest: [
      verifyJWT,
      loadMembership,
      requirePermission('can_manage_members'),
    ],
    schema: {
      tags: ['Invitations'],
      summary: 'Revoke invitation',
      description: 'Revokes an invitation',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['group_id', 'invitation_id'],
        properties: {
          group_id: { type: 'string', format: 'uuid' },
          invitation_id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          description: 'Invitation revoked successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: revokeInvitation,
  });

  // Log registered routes
  customLogger.route('POST', '/api/groups/:group_id/invitations');
  customLogger.route('GET', '/api/invitations/:code_or_pseudo');
  customLogger.route('POST', '/api/invitations/:code_or_pseudo/accept');
  customLogger.route('GET', '/api/groups/:group_id/invitations');
  customLogger.route(
    'DELETE',
    '/api/groups/:group_id/invitations/:invitation_id'
  );
}
