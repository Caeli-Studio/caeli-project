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
    schema: {
      tags: ['Notifications'],
      summary: 'Get notifications',
      description: 'Retrieves notifications for the authenticated user',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          unread_only: { type: 'boolean' },
          type: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'integer', minimum: 0, default: 0 },
        },
      },
      response: {
        200: {
          description: 'List of notifications',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    handler: getNotifications,
  });

  fastify.put('/:notification_id/read', {
    onRequest: [verifyJWT],
    schema: {
      tags: ['Notifications'],
      summary: 'Mark as read',
      description: 'Marks a notification as read',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['notification_id'],
        properties: {
          notification_id: {
            type: 'string',
            format: 'uuid',
            description: 'Notification ID',
          },
        },
      },
      response: {
        200: {
          description: 'Notification marked as read',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: markAsRead,
  });

  fastify.delete('/:notification_id', {
    onRequest: [verifyJWT],
    schema: {
      tags: ['Notifications'],
      summary: 'Delete notification',
      description: 'Deletes a notification',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['notification_id'],
        properties: {
          notification_id: {
            type: 'string',
            format: 'uuid',
            description: 'Notification ID',
          },
        },
      },
      response: {
        200: {
          description: 'Notification deleted successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: deleteNotification,
  });

  // Log registered routes
  customLogger.route('GET', '/api/notifications');
  customLogger.route('PUT', '/api/notifications/:notification_id/read');
  customLogger.route('DELETE', '/api/notifications/:notification_id');
}
