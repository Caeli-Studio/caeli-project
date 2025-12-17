import {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
} from '../controllers/role.controller';
import { loadMembership, requirePermission } from '../middleware/permissions';
import { verifyJWT } from '../utils/auth';

import type { FastifyInstance } from 'fastify';

export default async function roleRoutes(fastify: FastifyInstance) {
  // GET /api/groups/:group_id/roles - List all roles
  fastify.get('/', {
    onRequest: [verifyJWT, loadMembership],
    handler: getRoles,
  });

  // GET /api/groups/:group_id/roles/:role_id - Get a specific role
  fastify.get('/:role_id', {
    onRequest: [verifyJWT, loadMembership],
    handler: getRole,
  });

  // POST /api/groups/:group_id/roles - Create a role
  fastify.post('/', {
    onRequest: [
      verifyJWT,
      loadMembership,
      requirePermission('can_manage_roles'),
    ],
    handler: createRole,
  });

  // PUT /api/groups/:group_id/roles/:role_id - Update a role
  fastify.put('/:role_id', {
    onRequest: [
      verifyJWT,
      loadMembership,
      requirePermission('can_manage_roles'),
    ],
    handler: updateRole,
  });

  // DELETE /api/groups/:group_id/roles/:role_id - Delete a role
  fastify.delete('/:role_id', {
    onRequest: [
      verifyJWT,
      loadMembership,
      requirePermission('can_manage_roles'),
    ],
    handler: deleteRole,
  });
}
