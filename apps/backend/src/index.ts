import 'dotenv/config';

import { createApp } from './app';
import { customLogger } from './utils/logger';

/**
 * Environment configuration
 */
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Main application startup function
 */
async function start() {
  try {
    // Print ASCII logo
    customLogger.printLogo();

    // Create and configure app
    const app = await createApp();

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
