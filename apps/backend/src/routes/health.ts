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
  app.get('/', healthCheckHandler);

  // Kubernetes-style liveness probe
  app.get('/live', livenessHandler);

  // Kubernetes-style readiness probe
  app.get('/ready', readinessHandler);

  customLogger.route('GET', '/api/health');
  customLogger.route('GET', '/api/health/live');
  customLogger.route('GET', '/api/health/ready');
}
