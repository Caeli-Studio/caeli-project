import { customLogger } from '../utils/logger';

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

/**
 * Health check route handler
 * Returns basic health status and system information
 * @param {FastifyRequest} _request - Fastify request object (unused)
 * @param {FastifyReply} reply - Fastify reply object
 */
async function healthCheckHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB',
    },
  };

  reply.code(200).send(healthData);
}

/**
 * Liveness probe handler
 * Simple endpoint to check if the service is alive
 * @param {FastifyRequest} _request - Fastify request object (unused)
 * @param {FastifyReply} reply - Fastify reply object
 */
async function livenessHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  reply.code(200).send({ alive: true });
}

/**
 * Readiness probe handler
 * Checks if the service is ready to accept traffic
 * @param {FastifyRequest} _request - Fastify request object (unused)
 * @param {FastifyReply} reply - Fastify reply object
 */
async function readinessHandler(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Add additional checks here (database, cache, etc.)
  const isReady = true; // Replace with actual readiness checks

  if (isReady) {
    reply.code(200).send({ ready: true });
  } else {
    reply.code(503).send({ ready: false });
  }
}

/**
 * Registers health check routes
 * @param {FastifyInstance} app - The Fastify application instance
 */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  // Main health check endpoint
  app.get('/', {
    handler: healthCheckHandler,
    schema: {
      tags: ['Health'],
      summary: 'Health check',
      description: 'Returns service health status and system information',
      response: {
        200: {
          description: 'Service is healthy',
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            environment: { type: 'string' },
            version: { type: 'string' },
            memory: {
              type: 'object',
              properties: {
                used: { type: 'number' },
                total: { type: 'number' },
                unit: { type: 'string' },
              },
            },
          },
        },
      },
    },
  });

  // Kubernetes-style liveness probe
  app.get('/live', {
    handler: livenessHandler,
    schema: {
      tags: ['Health'],
      summary: 'Liveness probe',
      description:
        'Simple endpoint to check if the service is alive (Kubernetes liveness probe)',
      response: {
        200: {
          description: 'Service is alive',
          type: 'object',
          properties: {
            alive: { type: 'boolean' },
          },
        },
      },
    },
  });

  // Kubernetes-style readiness probe
  app.get('/ready', {
    handler: readinessHandler,
    schema: {
      tags: ['Health'],
      summary: 'Readiness probe',
      description:
        'Checks if the service is ready to accept traffic (Kubernetes readiness probe)',
      response: {
        200: {
          description: 'Service is ready',
          type: 'object',
          properties: {
            ready: { type: 'boolean' },
          },
        },
        503: {
          description: 'Service is not ready',
          type: 'object',
          properties: {
            ready: { type: 'boolean' },
          },
        },
      },
    },
  });

  customLogger.route('GET', '/api/health');
  customLogger.route('GET', '/api/health/live');
  customLogger.route('GET', '/api/health/ready');
}
