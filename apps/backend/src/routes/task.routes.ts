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
    schema: {
      tags: ['Tasks'],
      summary: 'Create a task',
      description:
        'Creates a new task in the group. Optionally assign it to members.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 1000 },
          is_free: { type: 'boolean', default: false },
          due_at: { type: 'string', format: 'date-time' },
          assigned_to: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
          },
        },
      },
      response: {
        201: {
          description: 'Task created successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: createTask,
  });

  fastify.get('/', {
    onRequest: [verifyJWT, loadMembership],
    schema: {
      tags: ['Tasks'],
      summary: 'Get tasks',
      description: 'Retrieves tasks for the group with optional filters',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['open', 'done', 'cancelled'] },
          assigned_to_me: { type: 'boolean' },
          is_free: { type: 'boolean' },
          from: { type: 'string', format: 'date-time' },
          to: { type: 'string', format: 'date-time' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'integer', minimum: 0, default: 0 },
        },
      },
      response: {
        200: {
          description: 'List of tasks',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    handler: getTasks,
  });

  fastify.get('/:task_id', {
    onRequest: [verifyJWT, loadMembership],
    schema: {
      tags: ['Tasks'],
      summary: 'Get task details',
      description: 'Retrieves detailed information about a specific task',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['task_id'],
        properties: {
          task_id: { type: 'string', format: 'uuid', description: 'Task ID' },
        },
      },
      response: {
        200: {
          description: 'Task details',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: getTask,
  });

  fastify.put('/:task_id', {
    onRequest: [
      verifyJWT,
      loadMembership,
      requirePermission('can_create_tasks'),
    ],
    schema: {
      tags: ['Tasks'],
      summary: 'Update task',
      description: 'Updates task information',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['task_id'],
        properties: {
          task_id: { type: 'string', format: 'uuid', description: 'Task ID' },
        },
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 1000 },
          status: { type: 'string', enum: ['open', 'done', 'cancelled'] },
          is_free: { type: 'boolean' },
          due_at: { type: 'string', format: 'date-time' },
        },
      },
      response: {
        200: {
          description: 'Task updated successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: updateTask,
  });

  fastify.delete('/:task_id', {
    onRequest: [
      verifyJWT,
      loadMembership,
      requirePermission('can_delete_tasks'),
    ],
    schema: {
      tags: ['Tasks'],
      summary: 'Delete task',
      description: 'Permanently deletes a task. Requires delete permission.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['task_id'],
        properties: {
          task_id: { type: 'string', format: 'uuid', description: 'Task ID' },
        },
      },
      response: {
        200: {
          description: 'Task deleted successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: deleteTask,
  });

  fastify.post('/:task_id/assign', {
    onRequest: [
      verifyJWT,
      loadMembership,
      requirePermission('can_assign_tasks'),
    ],
    schema: {
      tags: ['Tasks'],
      summary: 'Assign task',
      description: 'Assigns a task to one or more members',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['task_id'],
        properties: {
          task_id: { type: 'string', format: 'uuid', description: 'Task ID' },
        },
      },
      body: {
        type: 'object',
        required: ['membership_ids'],
        properties: {
          membership_ids: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
            minItems: 1,
          },
        },
      },
      response: {
        200: {
          description: 'Task assigned successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: assignTask,
  });

  fastify.post('/:task_id/complete', {
    onRequest: [verifyJWT, loadMembership],
    schema: {
      tags: ['Tasks'],
      summary: 'Complete task',
      description: 'Marks a task as completed',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['task_id'],
        properties: {
          task_id: { type: 'string', format: 'uuid', description: 'Task ID' },
        },
      },
      response: {
        200: {
          description: 'Task completed successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: completeTask,
  });

  fastify.post('/:task_id/take', {
    onRequest: [verifyJWT, loadMembership],
    schema: {
      tags: ['Tasks'],
      summary: 'Take free task',
      description: 'Takes a free task (assigns it to yourself)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['task_id'],
        properties: {
          task_id: { type: 'string', format: 'uuid', description: 'Task ID' },
        },
      },
      response: {
        200: {
          description: 'Task taken successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
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
