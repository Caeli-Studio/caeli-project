import { customLogger } from '../utils/logger';

import authRoutes from './auth.routes';
import groupRoutes from './group.routes';
import { healthRoutes } from './health';
import hubRoutes from './hub.routes';
import membershipRoutes from './membership.routes';
import notificationRoutes from './notification.routes';
import profileRoutes from './profile.routes';
import supabaseHealthRoutes from './supabase-health.routes';
import taskRoutes from './task.routes';
import transferRoutes from './transfer.routes';

import type { FastifyInstance } from 'fastify';

/**
 * Registers all API routes with the Fastify instance
 * @param {FastifyInstance} app - The Fastify application instance
 */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  customLogger.info('Registering routes...');

  // API routes
  await app.register(
    async (api) => {
      // Health check routes
      await api.register(healthRoutes, { prefix: '/health' });

      // Supabase health check routes
      await api.register(supabaseHealthRoutes, { prefix: '/health' });

      // Authentication routes (Google OAuth)
      await api.register(authRoutes, { prefix: '/auth' });

      // Profile routes
      await api.register(profileRoutes, { prefix: '/profile' });

      // Group routes
      await api.register(groupRoutes, { prefix: '/groups' });

      // Notification routes
      await api.register(notificationRoutes, { prefix: '/notifications' });

      // Group-scoped routes
      await api.register(
        async (groupApi) => {
          // Task routes
          await groupApi.register(taskRoutes, { prefix: '/:group_id/tasks' });

          // Member routes
          await groupApi.register(membershipRoutes, {
            prefix: '/:group_id/members',
          });

          // Transfer routes
          await groupApi.register(transferRoutes, {
            prefix: '/:group_id/transfers',
          });

          // Hub/Monitor routes
          await groupApi.register(hubRoutes, { prefix: '/:group_id/hub' });
        },
        { prefix: '/groups' }
      );
    },
    { prefix: '/api' }
  );

  customLogger.success('All routes registered successfully');
}
