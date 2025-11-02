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
    handler: getMembers,
  });

  fastify.get('/:membership_id', {
    onRequest: [verifyJWT, loadMembership],
    handler: getMember,
  });

  fastify.post('/invite', {
    onRequest: [
      verifyJWT,
      loadMembership,
      requirePermission('can_manage_members'),
    ],
    handler: inviteMember,
  });

  fastify.put('/:membership_id', {
    onRequest: [
      verifyJWT,
      loadMembership,
      requirePermission('can_manage_members'),
    ],
    handler: updateMember,
  });

  fastify.delete('/:membership_id', {
    onRequest: [
      verifyJWT,
      loadMembership,
      requirePermission('can_manage_members'),
    ],
    handler: removeMember,
  });

  // Log registered routes
  customLogger.route('GET', '/api/groups/:group_id/members');
  customLogger.route('GET', '/api/groups/:group_id/members/:membership_id');
  customLogger.route('POST', '/api/groups/:group_id/members/invite');
  customLogger.route('PUT', '/api/groups/:group_id/members/:membership_id');
  customLogger.route('DELETE', '/api/groups/:group_id/members/:membership_id');
}
