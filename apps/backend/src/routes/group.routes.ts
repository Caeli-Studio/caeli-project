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
  });

  fastify.get('/', {
    onRequest: [verifyJWT],
    handler: getMyGroups,
  });

  fastify.get('/:group_id', {
    onRequest: [verifyJWT, loadMembership],
    handler: getGroup,
  });

  fastify.put('/:group_id', {
    onRequest: [verifyJWT, loadMembership, requirePermission('can_edit_group')],
    handler: updateGroup,
  });

  fastify.delete('/:group_id', {
    onRequest: [verifyJWT, loadMembership, requireRole('owner')],
    handler: deleteGroup,
  });

  fastify.post('/:group_id/leave', {
    onRequest: [verifyJWT, loadMembership],
    handler: leaveGroup,
  });

  // Log registered routes
  customLogger.route('POST', '/api/groups');
  customLogger.route('GET', '/api/groups');
  customLogger.route('GET', '/api/groups/:group_id');
  customLogger.route('PUT', '/api/groups/:group_id');
  customLogger.route('DELETE', '/api/groups/:group_id');
  customLogger.route('POST', '/api/groups/:group_id/leave');
}
