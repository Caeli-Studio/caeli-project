import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import Fastify from 'fastify';

import { registerRoutes } from './routes';
import { errorHandler, notFoundHandler } from './utils/errors';
import { createLoggerConfig, customLogger } from './utils/logger';

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
