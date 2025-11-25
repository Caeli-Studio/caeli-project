import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import Fastify, { FastifyInstance } from 'fastify';

import { registerSupabase } from '../../config/supabase';
import { registerRoutes } from '../../routes';
import { errorHandler, notFoundHandler } from '../../utils/errors';

/**
 * Creates a test Fastify instance with all middleware and routes
 */
export async function createTestApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // Disable logging in tests
    disableRequestLogging: true,
  });

  // Override Fastify's default serializer to use standard JSON.stringify
  app.setSerializerCompiler(() => {
    return (data) => JSON.stringify(data);
  });

  // Register plugins
  await app.register(cors, {
    origin: '*',
    credentials: true,
  });

  await app.register(sensible);
  await registerSupabase(app);

  // Register error handlers
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  // Register routes
  await registerRoutes(app);

  return app;
}

/**
 * Closes and cleans up a test app instance
 */
export async function closeTestApp(app: FastifyInstance): Promise<void> {
  await app.close();
}
