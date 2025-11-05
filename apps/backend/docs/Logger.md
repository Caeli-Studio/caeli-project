# Logger Documentation

## Overview

The Caeli API uses a custom logging system built on top of [Pino](https://getpino.io/), one of the fastest Node.js loggers available. The logging system includes both structured JSON logging for production and pretty-printed, colorful logs for development.

## Features

- ✅ **Structured Logging**: JSON-formatted logs in production for easy parsing and analysis
- ✅ **Pretty Development Logs**: Colorful, human-readable logs during development
- ✅ **ASCII Art Logo**: Eye-catching "Caeli Api" logo on server startup
- ✅ **Custom Log Levels**: Info, success, warning, and error messages with emojis
- ✅ **Request Logging**: Automatic HTTP request/response logging
- ✅ **Error Tracking**: Comprehensive error logging with stack traces

## Logger Components

### 1. Pino Logger (`createLogger`)

The main structured logger used by Fastify for all internal logging.

```typescript
import { createLogger } from './utils/logger';

const logger = createLogger(true); // true for development mode
logger.info('Server started');
logger.error({ err: error }, 'An error occurred');
```

**Configuration:**

- **Development Mode**: Uses `pino-pretty` for formatted output
- **Production Mode**: Outputs raw JSON for log aggregation services
- **Log Level**: Controlled via `LOG_LEVEL` environment variable (default: 'info')

### 2. Custom Console Logger (`customLogger`)

A colorful, emoji-enhanced console logger for development visibility.

#### Methods

##### `printLogo()`

Displays the ASCII art "Caeli Api" logo.

```typescript
import { customLogger } from './utils/logger';

customLogger.printLogo();
```

##### `info(message: string)`

Logs informational messages with ℹ️ emoji.

```typescript
customLogger.info('Registering routes...');
// Output: ℹ️  INFO: Registering routes...
```

##### `success(message: string)`

Logs success messages with ✅ emoji.

```typescript
customLogger.success('All routes registered successfully');
// Output: ✅ SUCCESS: All routes registered successfully
```

##### `warn(message: string)`

Logs warning messages with ⚠️ emoji.

```typescript
customLogger.warn('Deprecation warning');
// Output: ⚠️  WARNING: Deprecation warning
```

##### `error(message: string, error?: Error)`

Logs error messages with ❌ emoji and optional stack trace.

```typescript
customLogger.error('Failed to connect to database', dbError);
// Output: ❌ ERROR: Failed to connect to database
//         [stack trace if error provided]
```

##### `serverStart(port: number, host: string, environment: string)`

Displays detailed server startup information.

```typescript
customLogger.serverStart(3000, '0.0.0.0', 'development');
```

Output:

```
═══════════════════════════════════════════════════════
🚀 Server started successfully!
═══════════════════════════════════════════════════════
📍 Address:     http://0.0.0.0:3000
🌍 Environment: development
⏰ Time:        10/7/2025, 3:45:12 PM
═══════════════════════════════════════════════════════
```

##### `route(method: string, path: string)`

Logs route registration with color-coded HTTP methods.

```typescript
customLogger.route('GET', '/api/v1/users');
customLogger.route('POST', '/api/v1/users');
customLogger.route('PUT', '/api/v1/users/:id');
customLogger.route('DELETE', '/api/v1/users/:id');
```

Output:

```
📌 Route: GET     /api/v1/users
📌 Route: POST    /api/v1/users
📌 Route: PUT     /api/v1/users/:id
📌 Route: DELETE  /api/v1/users/:id
```

## Usage Examples

### In Route Handlers

```typescript
import type { FastifyInstance } from 'fastify';
import { customLogger } from '../utils/logger';

export async function userRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    request.log.info('Fetching all users');
    // ... handler logic
  });

  customLogger.route('GET', '/api/v1/users');
}
```

### During Server Initialization

```typescript
import { customLogger, createLogger } from './utils/logger';

// Print logo on startup
customLogger.printLogo();

// Create Fastify with logger
const app = Fastify({
  logger: createLogger(isDevelopment),
});

// Log route registration
customLogger.info('Registering routes...');
await registerRoutes(app);
customLogger.success('Routes registered successfully');
```

### Error Handling

```typescript
try {
  await riskyOperation();
} catch (err) {
  if (err instanceof Error) {
    customLogger.error('Operation failed', err);
    request.log.error({ err }, 'Operation failed');
  }
}
```

## Environment Variables

| Variable    | Description                 | Default       | Options                                |
| ----------- | --------------------------- | ------------- | -------------------------------------- |
| `LOG_LEVEL` | Minimum log level to output | `info`        | trace, debug, info, warn, error, fatal |
| `NODE_ENV`  | Environment mode            | `development` | development, production                |

## Best Practices

1. **Use Pino logger (`request.log`) for request-scoped logging** - This automatically includes request context
2. **Use `customLogger` for application-level events** - Server startup, route registration, etc.
3. **Always include error objects** when logging errors for better stack traces
4. **Use appropriate log levels**:
   - `trace/debug`: Development debugging
   - `info`: General information
   - `warn`: Warning conditions
   - `error`: Error conditions
   - `fatal`: Critical errors requiring immediate attention

5. **Structured logging in handlers**:
   ```typescript
   request.log.info(
     {
       userId: user.id,
       action: 'login',
     },
     'User logged in'
   );
   ```

## Color Coding

The custom logger uses the following color scheme:

- **Blue**: Info messages, HTTP GET methods
- **Green**: Success messages, HTTP POST methods
- **Yellow**: Warnings, HTTP PUT methods, development environment
- **Red**: Errors, HTTP DELETE methods
- **Cyan**: URLs, timestamps, ASCII art
- **Gray**: Secondary information

## ASCII Logo

The "Caeli Api" ASCII logo is automatically displayed on server startup and includes:

- Stylized "CAELI" text using box-drawing characters
- Rocket emoji (🚀) decorations
- Cyan color for visual appeal

You can customize the logo by editing the `getAsciiLogo()` function in `src/utils/logger.ts`.
