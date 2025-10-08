# Caeli API Backend

<div alig- ⚡ **High Performance** - Built on Fastify, one of the fastest Node.js frameworks
- 🔒 **Type Safety** - Full TypeScript support with strict type checking
- 📝 **Schema Validation** - Request/response validation with Zod
- 💾 **Database** - PostgreSQL with Drizzle ORM for type-safe queries
### Environment Variables

| Variable                      | Description                 | Default       | Required |
| ----------------------------- | --------------------------- | ------------- | -------- | ---------------------------------------------------------------------------------- |
| `PORT`                        | Server port number          | `3000`        | No       |
| `HOST`                        | Server host address         | `0.0.0.0`     | No       |
| `NODE_ENV`                    | Environment mode            | `development` | No       |
| `LOG_LEVEL`                   | Logging level               | `info`        | No       |
| `DATABASE_URL`                | PostgreSQL connection URL   | -             | Yes      |
| `BETTER_AUTH_SECRET`          | Auth encryption secret      | -             | Yes      |
| `BETTER_AUTH_URL`             | Base URL of your app        | -             | Yes      |
| `BETTER_AUTH_TRUSTED_ORIGINS` | CORS trusted origins        | -             | No       |
| `ALLOWED_ORIGINS`             | CORS allowed origins (prod) | `*` (dev)     | No       | hentication\*\* - Better Auth integration with email/password and social providers |

- 🎨 **Custom Logger** - Beautiful ASCII art logo with colorful, emoji-enhanced logging
- 🛡️ **Error Handling** - Comprehensive error handling with proper HTTP status codes
- 📊 **Health Checks** - Built-in health endpoints for monitoring and orchestration
- 🐳 **Docker Ready** - Full containerization support with docker-compose
- 🔄 **Hot Reload** - Fast development with automatic server restart
- 🎯 **MVC Architecture** - Clean separation of concerns with Models, Controllers, Services
- 📚 **Well Documented** - Comprehensive documentation and examples

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
- 💾 **Database** - PostgreSQL with Drizzle ORM for type-safe queries
- 🎨 **Custom Logger** - Beautiful ASCII art logo with colorful, emoji-enhanced logging
- 🛡️ **Error Handling** - Comprehensive error handling with proper HTTP status codes
- 📊 **Health Checks** - Built-in health endpoints for monitoring and orchestration
- � **Docker Ready** - Full containerization support with docker-compose
- �🔄 **Hot Reload** - Fast development with automatic server restart
- 🎯 **MVC Architecture** - Clean separation of concerns with Models, Controllers, Services
- 📚 **Well Documented** - Comprehensive documentation and examples

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

### 2. Database Setup

```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Run database migrations
pnpm db:push
```

📖 See [SETUP.md](./docs/SETUP.md) for detailed database setup instructions.

### 3. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# DATABASE_URL=postgresql://caeli:caeli_password@localhost:5432/caeli_db
# PORT=3000
# NODE_ENV=development
```

### 4. Run the Server

```bash
# Development mode with hot reload
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start
```

### 5. Verify Installation

Visit http://localhost:3000/api/health to see the health check response:

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
│   ├── models/               # Data models and Zod schemas
│   │   └── user.model.ts     # User validation schemas
│   ├── services/             # Business logic layer
│   │   └── user.service.ts   # User CRUD operations
│   ├── controllers/          # HTTP request handlers
│   │   └── user.controller.ts # User endpoint handlers
│   ├── routes/               # API route definitions
│   │   ├── index.ts          # Route registration
│   │   ├── health.ts         # Health check endpoints
│   │   └── user.routes.ts    # User CRUD routes
│   ├── db/                   # Database layer
│   │   ├── index.ts          # Database connection
│   │   └── schema/           # Drizzle schemas
│   │       └── users.schema.ts
│   └── utils/                # Utility functions
│       ├── logger.ts         # Custom logger with ASCII art
│       └── errors.ts         # Error handling utilities
├── docs/                     # Documentation
│   ├── Database.md           # Database setup and usage
│   ├── Logger.md             # Logger documentation
│   ├── MVC-Flow.md           # MVC architecture flow
│   ├── SETUP.md              # Quick setup guide
│   └── Structure.md          # Architecture details
├── .env.example              # Environment variables template
├── docker-compose.yml        # PostgreSQL container setup
├── Dockerfile                # Production container image
├── drizzle.config.ts         # Drizzle ORM configuration
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

📖 See [Structure.md](./docs/Structure.md) for detailed architecture documentation.

## 🛠️ Available Scripts

| Command            | Description                              |
| ------------------ | ---------------------------------------- |
| `pnpm dev`         | Start development server with hot reload |
| `pnpm build`       | Build for production                     |
| `pnpm start`       | Start production server                  |
| `pnpm lint`        | Run ESLint to check code quality         |
| `pnpm lint:fix`    | Fix ESLint errors automatically          |
| `pnpm type-check`  | Run TypeScript compiler to check types   |
| `pnpm clean`       | Remove build artifacts                   |
| `pnpm db:generate` | Generate database migration              |
| `pnpm db:migrate`  | Run database migrations                  |
| `pnpm db:push`     | Push schema changes to database          |
| `pnpm db:studio`   | Open Drizzle Studio (database GUI)       |

## 📡 API Endpoints

### Health Checks

| Method | Endpoint            | Description                  |
| ------ | ------------------- | ---------------------------- |
| GET    | `/api/health`       | Comprehensive health check   |
| GET    | `/api/health/live`  | Liveness probe (Kubernetes)  |
| GET    | `/api/health/ready` | Readiness probe (Kubernetes) |

### User Management (CRUD)

| Method | Endpoint         | Description     |
| ------ | ---------------- | --------------- |
| GET    | `/api/users`     | Get all users   |
| GET    | `/api/users/:id` | Get user by ID  |
| POST   | `/api/users`     | Create new user |
| PUT    | `/api/users/:id` | Update user     |
| DELETE | `/api/users/:id` | Delete user     |

### Authentication (Better Auth)

| Method | Endpoint                  | Description          |
| ------ | ------------------------- | -------------------- |
| POST   | `/api/auth/sign-up/email` | Sign up with email   |
| POST   | `/api/auth/sign-in/email` | Sign in with email   |
| POST   | `/api/auth/sign-out`      | Sign out             |
| GET    | `/api/auth/session`       | Get current session  |
| POST   | `/api/auth/verify-email`  | Verify email address |

📖 See [Auth.md](./docs/Auth.md) for complete authentication documentation.

### Example Request

```bash
# Create a new user
curl -X POST http://localhost:3000/api/users \
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
    "age": 30,
    "createdAt": "2025-10-07T12:00:00.000Z",
    "updatedAt": "2025-10-07T12:00:00.000Z"
  }
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
📌 Route: GET     /api/health
📌 Route: GET     /api/health/live
📌 Route: GET     /api/health/ready
📌 Route: GET     /api/users
📌 Route: GET     /api/users/:id
📌 Route: POST    /api/users
📌 Route: PUT     /api/users/:id
📌 Route: DELETE  /api/users/:id
✅ SUCCESS: All routes registered successfully
```

📖 See [Logger.md](./docs/Logger.md) for complete logger documentation.

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
    "path": "/api/users/invalid-id"
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
| `DATABASE_URL`    | PostgreSQL connection URL   | -             | Yes      |
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

  customLogger.route('GET', '/api/users');
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

## 🐳 Docker Support

The project includes full Docker support with PostgreSQL database:

```bash
# Start PostgreSQL database
docker-compose up -d

# Build and run the backend in Docker
docker build -t caeli-api .
docker run -p 3000:3000 --env-file .env caeli-api
```

See [Database.md](./docs/Database.md) for detailed database setup instructions.

## 📊 Monitoring & Observability

### Health Check Endpoints

Perfect for container orchestration:

- **Liveness**: `/api/health/live` - Is the service alive?
- **Readiness**: `/api/health/ready` - Can it accept traffic?

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

## 💾 Database

PostgreSQL database with Drizzle ORM:

- **Type-safe queries** with Drizzle ORM
- **Schema migrations** with Drizzle Kit
- **Docker support** with docker-compose
- **Connection pooling** for performance

```bash
# Run migrations
pnpm db:migrate

# Generate new migration
pnpm db:generate

# Open Drizzle Studio
pnpm db:studio
```

📖 See [Database.md](./docs/Database.md) for complete database documentation.

## 🔐 Authentication

Better Auth integration for modern, secure authentication:

- **Email & Password** - Traditional authentication
- **Social Providers** - GitHub, Google, and more
- **Session Management** - Secure, automatic session handling
- **Type-Safe** - Full TypeScript support with Drizzle ORM

```bash
# Sign up a new user
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'

# Sign in
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

📖 See [Auth.md](./docs/Auth.md) for complete authentication setup and usage.

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

**Built with ❤️ using Fastify, TypeScript, PostgreSQL, Drizzle ORM, and Better Auth**

[Documentation](./docs/Structure.md) • [Database Setup](./docs/Database.md) • [Authentication](./docs/Auth.md) • [Logger Docs](./docs/Logger.md) • [Report Bug](../../issues) • [Request Feature](../../issues)

</div>
