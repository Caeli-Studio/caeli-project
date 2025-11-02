import {
  assignTask,
  completeTask,
  createTask,
  deleteTask,
  getTask,
  getTasks,
  takeTask,
  updateTask,
} from '../controllers/task.controller';
import { loadMembership, requirePermission } from '../middleware/permissions';
import { verifyJWT } from '../utils/auth';
import { customLogger } from '../utils/logger';

import type { FastifyInstance } from 'fastify';

/**
 * Task routes
 */
export default async function taskRoutes(fastify: FastifyInstance) {
  fastify.post('/', {
    onRequest: [
      verifyJWT,
      loadMembership,
      requirePermission('can_create_tasks'),
    ],
    handler: createTask,
  });

  fastify.get('/', {
    onRequest: [verifyJWT, loadMembership],
    handler: getTasks,
  });

  fastify.get('/:task_id', {
    onRequest: [verifyJWT, loadMembership],
    handler: getTask,
  });

  fastify.put('/:task_id', {
    onRequest: [
      verifyJWT,
      loadMembership,
      requirePermission('can_create_tasks'),
    ],
    handler: updateTask,
  });

  fastify.delete('/:task_id', {
    onRequest: [
      verifyJWT,
      loadMembership,
      requirePermission('can_delete_tasks'),
    ],
    handler: deleteTask,
  });

  fastify.post('/:task_id/assign', {
    onRequest: [
      verifyJWT,
      loadMembership,
      requirePermission('can_assign_tasks'),
    ],
    handler: assignTask,
  });

  fastify.post('/:task_id/complete', {
    onRequest: [verifyJWT, loadMembership],
    handler: completeTask,
  });

  fastify.post('/:task_id/take', {
    onRequest: [verifyJWT, loadMembership],
    handler: takeTask,
  });

  // Log registered routes
  customLogger.route('POST', '/api/groups/:group_id/tasks');
  customLogger.route('GET', '/api/groups/:group_id/tasks');
  customLogger.route('GET', '/api/groups/:group_id/tasks/:task_id');
  customLogger.route('PUT', '/api/groups/:group_id/tasks/:task_id');
  customLogger.route('DELETE', '/api/groups/:group_id/tasks/:task_id');
  customLogger.route('POST', '/api/groups/:group_id/tasks/:task_id/assign');
  customLogger.route('POST', '/api/groups/:group_id/tasks/:task_id/complete');
  customLogger.route('POST', '/api/groups/:group_id/tasks/:task_id/take');
}
