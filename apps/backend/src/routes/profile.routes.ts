import {
  createProfile,
  getMyProfile,
  getUserProfile,
  updateMyProfile,
} from '../controllers/profile.controller';
import { verifyJWT } from '../utils/auth';
import { customLogger } from '../utils/logger';

import type { FastifyInstance } from 'fastify';

/**
 * Profile routes
 */
export default async function profileRoutes(fastify: FastifyInstance) {
  fastify.get('/me', {
    onRequest: [verifyJWT],
    handler: getMyProfile,
  });

  fastify.put('/me', {
    onRequest: [verifyJWT],
    handler: updateMyProfile,
  });

  fastify.post('/', {
    onRequest: [verifyJWT],
    handler: createProfile,
  });

  fastify.get('/:user_id', {
    onRequest: [verifyJWT],
    handler: getUserProfile,
  });

  // Log registered routes
  customLogger.route('GET', '/api/profile/me');
  customLogger.route('PUT', '/api/profile/me');
  customLogger.route('POST', '/api/profile');
  customLogger.route('GET', '/api/profile/:user_id');
}
