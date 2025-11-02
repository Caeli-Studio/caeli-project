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
    handler: createHubSession,
  });

  fastify.post('/connect', {
    handler: connectToHub,
  });

  fastify.post('/disconnect', {
    handler: disconnectFromHub,
  });

  fastify.get('/status', {
    onRequest: [verifyJWT, loadMembership],
    handler: getHubStatus,
  });

  // Log registered routes
  customLogger.route('POST', '/api/groups/:group_id/hub/session');
  customLogger.route('POST', '/api/groups/:group_id/hub/connect');
  customLogger.route('POST', '/api/groups/:group_id/hub/disconnect');
  customLogger.route('GET', '/api/groups/:group_id/hub/status');
}
