import { customLogger } from '../utils/logger';

import { healthRoutes } from './health';
import { userRoutes } from './user.routes';

import type { FastifyInstance } from 'fastify';

/**
 * Registers all API routes with the Fastify instance
 * @param {FastifyInstance} app - The Fastify application instance
 */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  customLogger.info('Registering routes...');

  // API v1 routes
  await app.register(
    async (api) => {
      // Health check routes
      await api.register(healthRoutes, { prefix: '/health' });

      // User routes (MVC pattern)
      await api.register(userRoutes, { prefix: '/users' });

      // Add more route modules here as you build them
      // await api.register(authRoutes, { prefix: '/auth' });
      // await api.register(productRoutes, { prefix: '/products' });
    },
    { prefix: '/api' }
  );

  customLogger.success('All routes registered successfully');
}
