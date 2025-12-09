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
import { createLoggerConfig, customLogger } from './utils/logger';
import fastifyMultipart from '@fastify/multipart';


/**
 * Environment configuration
 */
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_DEVELOPMENT = NODE_ENV === 'development';

/**
 * Creates and configures the Fastify application instance
 * @returns {FastifyInstance} Configured Fastify instance
 */
function createApp() {
  const app = Fastify({
    logger: createLoggerConfig(IS_DEVELOPMENT),
    disableRequestLogging: false,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
  });

  // Override Fastify's default serializer to use standard JSON.stringify
  // This preserves null values (fast-json-stringify removes them by default)
  app.setSerializerCompiler(() => {
    return (data) => JSON.stringify(data);
  });

  return app;
}

/**
 * Configures middleware and plugins
 * @param {FastifyInstance} app - The Fastify application instance
 */
async function setupMiddleware(app: ReturnType<typeof createApp>) {
  // CORS configuration
  await app.register(cors, {
    origin: IS_DEVELOPMENT ? '*' : process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true,
  });

  // Sensible plugin for useful utilities
  await app.register(sensible);

  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max
    },
  });

  // Register Swagger/OpenAPI documentation
  await app.register(swagger, swaggerOptions);
  await app.register(swaggerUi, swaggerUiOptions);

  // Register Supabase plugin
  await registerSupabase(app);

  // Custom error handler
  app.setErrorHandler(errorHandler);

  // 404 handler for undefined routes
  app.setNotFoundHandler(notFoundHandler);
}

/**
 * Main application startup function
 */
async function start() {
  try {
    // Print ASCII logo
    customLogger.printLogo();

    // Create and configure app
    const app = createApp();

    // Setup middleware
    await setupMiddleware(app);

    // Register routes
    await registerRoutes(app);

    // Start server
    await app.listen({ port: PORT, host: HOST });

    // Log server info
    customLogger.serverStart(PORT, HOST, NODE_ENV);

    // Log Swagger documentation URL
    customLogger.success(
      `📚 API Documentation: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/docs`
    );

    // Graceful shutdown handlers
    const signals = ['SIGINT', 'SIGTERM'] as const;
    for (const signal of signals) {
      process.on(signal, async () => {
        customLogger.warn(`Received ${signal}, closing server gracefully...`);
        await app.close();
        customLogger.success('Server closed successfully');
        process.exit(0);
      });
    }
  } catch (err) {
    if (err instanceof Error) {
      customLogger.error('Failed to start server', err);
    }
    process.exit(1);
  }
}

// Start the application
start();
