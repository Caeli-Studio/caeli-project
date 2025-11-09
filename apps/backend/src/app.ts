import 'dotenv/config';

import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';

import { registerSupabase } from './config/supabase';
import { swaggerOptions, swaggerUiOptions } from './config/swagger';
import { registerRoutes } from './routes';
import { errorHandler, notFoundHandler } from './utils/errors';
import { createLoggerConfig } from './utils/logger';

/**
 * Environment configuration
 */
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_DEVELOPMENT = NODE_ENV === 'development';

/**
 * Creates and configures the Fastify application instance
 * @returns {FastifyInstance} Configured Fastify instance
 */
export async function createApp() {
  const app = Fastify({
    logger: createLoggerConfig(IS_DEVELOPMENT),
    disableRequestLogging: false,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
  });

  // CORS configuration
  await app.register(cors, {
    origin:
      IS_DEVELOPMENT || NODE_ENV === 'test'
        ? true
        : process.env.ALLOWED_ORIGINS?.split(',') || [],
    credentials: true,
  });

  // Sensible plugin for useful utilities
  await app.register(sensible);

  // Register Swagger/OpenAPI documentation
  await app.register(swagger, swaggerOptions);
  await app.register(swaggerUi, swaggerUiOptions);

  // Register Supabase plugin
  await registerSupabase(app);

  // Custom error handler
  app.setErrorHandler(errorHandler);

  // 404 handler for undefined routes
  app.setNotFoundHandler(notFoundHandler);

  // Register routes
  await registerRoutes(app);

  return app;
}

// Export app pour les tests
export default createApp;
