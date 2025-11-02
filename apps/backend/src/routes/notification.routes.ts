import {
  deleteNotification,
  getNotifications,
  markAsRead,
} from '../controllers/notification.controller';
import { verifyJWT } from '../utils/auth';
import { customLogger } from '../utils/logger';

import type { FastifyInstance } from 'fastify';

/**
 * Notification routes
 */
export default async function notificationRoutes(fastify: FastifyInstance) {
  fastify.get('/', {
    onRequest: [verifyJWT],
    handler: getNotifications,
  });

  fastify.put('/:notification_id/read', {
    onRequest: [verifyJWT],
    handler: markAsRead,
  });

  fastify.delete('/:notification_id', {
    onRequest: [verifyJWT],
    handler: deleteNotification,
  });

  // Log registered routes
  customLogger.route('GET', '/api/notifications');
  customLogger.route('PUT', '/api/notifications/:notification_id/read');
  customLogger.route('DELETE', '/api/notifications/:notification_id');
}
