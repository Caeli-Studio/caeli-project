# Caeli API Backend

<div align="center">

```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║     ██████╗ █████╗ ███████╗██╗     ██╗                ║
║    ██╔════╝██╔══██╗██╔════╝██║     ██║                ║
║    ██║     ███████║█████╗  ██║     ██║                ║
║    ██║     ██╔══██║██╔══╝  ██║     ██║                ║
║    ╚██████╗██║  ██║███████╗███████╗██║                ║
║     ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝                ║
║                                                       ║
║              🚀 API Server 🚀                          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

**A modern, production-ready Fastify backend API**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.6-black.svg)](https://www.fastify.io/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10+-orange.svg)](https://pnpm.io/)

</div>

## 🌟 Features

- ⚡ **High Performance** - Built on Fastify, one of the fastest Node.js frameworks
- 🔒 **Type Safety** - Full TypeScript support with strict type checking
- 📝 **Schema Validation** - Request/response validation with Zod
- 🎨 **Custom Logger** - Beautiful ASCII art logo with colorful, emoji-enhanced logging
- 🛡️ **Error Handling** - Comprehensive error handling with proper HTTP status codes
- 📊 **Health Checks** - Built-in health endpoints for monitoring and orchestration
- 🔄 **Hot Reload** - Fast development with automatic server restart
- 🎯 **Best Practices** - Clean architecture with separation of concerns
- 📚 **Well Documented** - JSDoc comments and comprehensive documentation

## 📋 Prerequisites

- **Node.js**: v20 or higher
- **pnpm**: v10 or higher
- **TypeScript**: v5.9 or higher

## 🚀 Quick Start

### 1. Installation

```bash
# Navigate to the backend directory
cd apps/backend

# Install dependencies
pnpm install
```

### 2. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# PORT=3000
# NODE_ENV=development
# LOG_LEVEL=info
```

### 3. Run the Server

```bash
# Development mode with hot reload
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start
```

### 4. Verify Installation

Visit http://localhost:3000/api/v1/health to see the health check response:

```json
{
  "status": "ok",
  "timestamp": "2025-10-07T12:00:00.000Z",
  "uptime": 123.456,
  "environment": "development",
  "version": "1.0.0",
  "memory": {
    "used": 45,
    "total": 128,
    "unit": "MB"
  }
}
```

## 📁 Project Structure

```
apps/backend/
├── src/
│   ├── index.ts              # Application entry point
│   ├── routes/               # API route handlers
│   │   ├── index.ts          # Route registration
│   │   ├── health.ts         # Health check endpoints
│   │   └── example.ts        # Example CRUD routes
│   └── utils/                # Utility functions
│       ├── logger.ts         # Custom logger with ASCII art
│       └── errors.ts         # Error handling utilities
├── .env.example              # Environment variables template
├── Logger.md                 # Logger documentation
├── Structure.md              # Architecture documentation
├── README.md                 # This file
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

📖 See [Structure.md](./Structure.md) for detailed architecture documentation.

## 🛠️ Available Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `pnpm dev`        | Start development server with hot reload |
| `pnpm build`      | Build for production                     |
| `pnpm start`      | Start production server                  |
| `pnpm lint`       | Run ESLint to check code quality         |
| `pnpm lint:fix`   | Fix ESLint errors automatically          |
| `pnpm type-check` | Run TypeScript compiler to check types   |
| `pnpm clean`      | Remove build artifacts                   |

## 📡 API Endpoints

### Health Checks

| Method | Endpoint               | Description                  |
| ------ | ---------------------- | ---------------------------- |
| GET    | `/api/v1/health`       | Comprehensive health check   |
| GET    | `/api/v1/health/live`  | Liveness probe (Kubernetes)  |
| GET    | `/api/v1/health/ready` | Readiness probe (Kubernetes) |

### Example CRUD Endpoints

| Method | Endpoint               | Description       |
| ------ | ---------------------- | ----------------- |
| GET    | `/api/v1/examples`     | Get all items     |
| GET    | `/api/v1/examples/:id` | Get item by ID    |
| POST   | `/api/v1/examples`     | Create new item   |
| DELETE | `/api/v1/examples/:id` | Delete item by ID |

### Example Request

```bash
# Create a new item
curl -X POST http://localhost:3000/api/v1/examples \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }'
```

### Example Response

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  },
  "message": "User created successfully"
}
```

## 🎨 Custom Logger

The Caeli API features a beautiful custom logger with:

- 🎨 **ASCII Art Logo** - Eye-catching "Caeli Api" banner on startup
- 🌈 **Colorful Output** - Color-coded messages for better readability
- 😀 **Emoji Support** - Visual indicators for different log levels
- 📊 **Server Info** - Detailed startup information display
- 🔍 **Route Tracking** - Automatic route registration logging

### Logger Example Output

```
═══════════════════════════════════════════════════════
🚀 Server started successfully!
═══════════════════════════════════════════════════════
📍 Address:     http://0.0.0.0:3000
🌍 Environment: development
⏰ Time:        10/7/2025, 3:45:12 PM
═══════════════════════════════════════════════════════

ℹ️  INFO: Registering routes...
📌 Route: GET     /api/v1/health
📌 Route: GET     /api/v1/health/live
📌 Route: GET     /api/v1/health/ready
📌 Route: GET     /api/v1/examples
📌 Route: POST    /api/v1/examples
✅ SUCCESS: All routes registered successfully
```

📖 See [Logger.md](./Logger.md) for complete logger documentation.

## 🛡️ Error Handling

Comprehensive error handling with:

- **Custom Error Classes** - `ApiError` for application-specific errors
- **Error Factory Functions** - Quick error creation (`createError.notFound()`, etc.)
- **Global Error Handler** - Consistent error response format
- **Validation Errors** - Automatic Zod validation error handling
- **Stack Traces** - Detailed error information in development mode

### Error Response Format

```json
{
  "error": {
    "message": "Resource not found",
    "statusCode": 404,
    "timestamp": "2025-10-07T12:00:00.000Z",
    "path": "/api/v1/examples/invalid-id"
  }
}
```

### Using Error Handlers

```typescript
import { createError } from '../utils/errors';

// In your route handler
if (!user) {
  throw createError.notFound('User not found');
}

// Available error types:
// - createError.badRequest()
// - createError.unauthorized()
// - createError.forbidden()
// - createError.notFound()
// - createError.conflict()
// - createError.validationError()
// - createError.internal()
```

## 🔧 Configuration

### Environment Variables

| Variable          | Description                 | Default       | Required |
| ----------------- | --------------------------- | ------------- | -------- |
| `PORT`            | Server port number          | `3000`        | No       |
| `HOST`            | Server host address         | `0.0.0.0`     | No       |
| `NODE_ENV`        | Environment mode            | `development` | No       |
| `LOG_LEVEL`       | Logging level               | `info`        | No       |
| `ALLOWED_ORIGINS` | CORS allowed origins (prod) | `*` (dev)     | No       |

### CORS Configuration

In development, CORS is wide open (`*`). For production, set `ALLOWED_ORIGINS`:

```env
ALLOWED_ORIGINS=https://example.com,https://app.example.com
```

## 🏗️ Building New Features

### Adding a New Route Module

1. Create a new route file:

```typescript
// src/routes/users.ts
import type { FastifyInstance } from 'fastify';
import { customLogger } from '../utils/logger';

/**
 * User route handlers
 * @param {FastifyInstance} app - Fastify instance
 */
export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', async (request, reply) => {
    return { users: [] };
  });

  customLogger.route('GET', '/api/v1/users');
}
```

2. Register in `src/routes/index.ts`:

```typescript
import { userRoutes } from './users';

// In the registerRoutes function
await api.register(userRoutes, { prefix: '/users' });
```

### Adding Validation with Zod

```typescript
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().int().min(18).optional(),
});

type CreateUserBody = z.infer<typeof userSchema>;

app.post<{ Body: CreateUserBody }>('/', {
  schema: {
    body: userSchema,
  },
  handler: async (request, reply) => {
    const userData = request.body; // Fully typed!
    // Your logic here
  },
});
```

## 🐳 Docker Support (Coming Soon)

```dockerfile
# Example Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Monitoring & Observability

### Health Check Endpoints

Perfect for container orchestration:

- **Liveness**: `/api/v1/health/live` - Is the service alive?
- **Readiness**: `/api/v1/health/ready` - Can it accept traffic?

### Logging

- **Development**: Pretty-printed, colorful logs with emojis
- **Production**: Structured JSON logs for log aggregation services

```json
{
  "level": 30,
  "time": 1696694400000,
  "msg": "Server listening at http://0.0.0.0:3000",
  "reqId": "req-1"
}
```

## 🧪 Testing (Coming Soon)

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Code Style

- **TypeScript** with strict mode enabled
- **ESLint** for code quality
- **JSDoc** comments for all public functions
- **Prettier** for code formatting (inherited from workspace)

## 🎓 Learning Resources

- [Fastify Documentation](https://www.fastify.io/docs/latest/)
- [Zod Documentation](https://zod.dev/)
- [Pino Logger](https://getpino.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📄 License

This project is part of the Caeli monorepo.

## 👥 Authors

Caeli Studio

---

<div align="center">

**Built with ❤️ using Fastify, TypeScript, and Pino**

[Documentation](./Structure.md) • [Logger Docs](./Logger.md) • [Report Bug](../../issues) • [Request Feature](../../issues)

</div>
