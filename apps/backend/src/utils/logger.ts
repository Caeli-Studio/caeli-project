import chalk from 'chalk';

/**
 * ASCII Art logo for Caeli API
 * @returns {string} The formatted ASCII art logo
 */
function getAsciiLogo(): string {
  return chalk.cyan(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║         ██████╗ █████╗ ███████╗██╗     ██╗            ║
║        ██╔════╝██╔══██╗██╔════╝██║     ██║            ║
║        ██║     ███████║█████╗  ██║     ██║            ║
║        ██║     ██╔══██║██╔══╝  ██║     ██║            ║
║        ╚██████╗██║  ██║███████╗███████╗██║            ║
║         ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝            ║
║                                                       ║
║                  ${chalk.yellow('🚀 API Server 🚀')}                     ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
}

/**
 * Custom Pino logger configuration with pretty printing for development
 * @param {boolean} isDevelopment - Whether the app is running in development mode
 * @returns {object} Pino logger configuration
 */
export function createLoggerConfig(isDevelopment = true) {
  const transport = isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          colorize: true,
          singleLine: false,
        },
      }
    : undefined;

  return {
    level: process.env.LOG_LEVEL || 'info',
    transport,
  };
}

/**
 * Custom console logger with emojis and colors
 */
export const customLogger = {
  /**
   * Prints the ASCII logo to the console
   */
  printLogo() {
    console.log(getAsciiLogo());
  },

  /**
   * Logs an informational message with emoji
   * @param {string} message - The message to log
   */
  info(message: string) {
    console.log(chalk.blue('ℹ️  INFO:'), chalk.white(message));
  },

  /**
   * Logs a success message with emoji
   * @param {string} message - The message to log
   */
  success(message: string) {
    console.log(chalk.green('✅ SUCCESS:'), chalk.white(message));
  },

  /**
   * Logs a warning message with emoji
   * @param {string} message - The message to log
   */
  warn(message: string) {
    console.log(chalk.yellow('⚠️  WARNING:'), chalk.white(message));
  },

  /**
   * Logs an error message with emoji
   * @param {string} message - The message to log
   * @param {Error} [error] - Optional error object
   */
  error(message: string, error?: Error) {
    console.log(chalk.red('❌ ERROR:'), chalk.white(message));
    if (error) {
      console.log(chalk.red(error.stack || error.message));
    }
  },

  /**
   * Logs server startup information
   * @param {number} port - The port number the server is running on
   * @param {string} host - The host address
   * @param {string} environment - The environment (development/production)
   */
  serverStart(port: number, host: string, environment: string) {
    console.log('\n');
    console.log(
      chalk.green('═══════════════════════════════════════════════════════')
    );
    console.log(chalk.green('🚀 Server started successfully!'));
    console.log(
      chalk.green('═══════════════════════════════════════════════════════')
    );
    console.log(
      chalk.white('📍 Address:    '),
      chalk.cyan(`http://${host}:${port}`)
    );
    console.log(
      chalk.white('🌍 Environment:'),
      environment === 'development'
        ? chalk.yellow(environment)
        : chalk.green(environment)
    );
    console.log(
      chalk.white('⏰ Time:       '),
      chalk.cyan(new Date().toLocaleString())
    );
    console.log(
      chalk.green('═══════════════════════════════════════════════════════')
    );
    console.log('\n');
  },

  /**
   * Logs route registration
   * @param {string} method - HTTP method
   * @param {string} path - Route path
   */
  route(method: string, path: string) {
    const methodColor =
      method === 'GET'
        ? chalk.green
        : method === 'POST'
          ? chalk.blue
          : method === 'PUT'
            ? chalk.yellow
            : method === 'DELETE'
              ? chalk.red
              : chalk.white;

    console.log(
      chalk.gray('📌 Route:'),
      methodColor(method.padEnd(6)),
      chalk.cyan(path)
    );
  },
};
