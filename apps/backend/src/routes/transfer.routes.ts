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
    handler: createTransfer,
  });

  fastify.get('/', {
    onRequest: [verifyJWT, loadMembership],
    handler: getTransfers,
  });

  fastify.get('/:transfer_id', {
    onRequest: [verifyJWT, loadMembership],
    handler: getTransfer,
  });

  fastify.post('/:transfer_id/accept', {
    onRequest: [verifyJWT, loadMembership],
    handler: acceptTransfer,
  });

  fastify.post('/:transfer_id/refuse', {
    onRequest: [verifyJWT, loadMembership],
    handler: refuseTransfer,
  });

  fastify.delete('/:transfer_id', {
    onRequest: [verifyJWT, loadMembership],
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
