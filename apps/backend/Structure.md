# Project Structure Documentation

## Overview

This document describes the architecture, folder structure, and design patterns used in the Caeli API backend application. The project follows industry best practices for building scalable, maintainable Fastify applications.

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: [Fastify](https://www.fastify.io/) v5.x - Fast and low overhead web framework
- **Validation**: [Zod](https://zod.dev/) - TypeScript-first schema validation
- **Logger**: [Pino](https://getpino.io/) - Super fast, low overhead logger
- **Package Manager**: pnpm (monorepo setup)

## Folder Structure

```
apps/backend/
├── src/
│   ├── index.ts              # Main application entry point
│   ├── models/               # Data models and schemas
│   │   └── user.model.ts     # User model with Zod schemas
│   ├── services/             # Business logic layer
│   │   └── user.service.ts   # User service with business logic
│   ├── controllers/          # Request handlers
│   │   └── user.controller.ts # User controller
│   ├── routes/               # Route definitions
│   │   ├── index.ts          # Route registration hub
│   │   ├── health.ts         # Health check endpoints
│   │   ├── user.routes.ts    # User routes (MVC pattern)
│   │   └── example.ts        # Example routes (legacy)
│   └── utils/                # Utility functions
│       ├── logger.ts         # Custom logging utilities
│       └── errors.ts         # Error handling utilities
├── .env.example              # Environment variables template
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

### Directory Breakdown

#### `src/`

The main source code directory containing all application logic.

#### `src/index.ts`

The application entry point that:

- Loads environment variables
- Creates and configures the Fastify instance
- Registers middleware and plugins
- Sets up error handlers
- Registers all routes
- Starts the HTTP server
- Handles graceful shutdown

#### `src/models/`

Contains data models, types, and validation schemas:

- **Purpose**: Define the structure and validation rules for data entities
- **Pattern**: Each model file exports schemas (using Zod) and TypeScript types
- **Example**: `user.model.ts` defines User type, create/update DTOs, and validation schemas

**Model Pattern:**

```typescript
import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  // ...
});

export type User = z.infer<typeof userSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
```

#### `src/services/`

Contains business logic and data access layer:

- **Purpose**: Implement business rules, data manipulation, and database operations
- **Pattern**: Services are classes with methods for specific operations
- **Responsibilities**:
  - Data validation and transformation
  - Business rule enforcement
  - Database/data store interactions
  - Complex computations

**Service Pattern:**

```typescript
export class UserService {
  async createUser(data: CreateUserDto): Promise<User> {
    // Business logic here
  }

  async getUserById(id: string): Promise<User> {
    // Data retrieval logic
  }
}

export const userService = new UserService();
```

#### `src/controllers/`

Contains HTTP request handlers:

- **Purpose**: Handle HTTP requests and responses
- **Pattern**: Controllers are classes with methods for each endpoint
- **Responsibilities**:
  - Parse and validate request data
  - Call appropriate service methods
  - Format and send responses
  - Handle HTTP-specific concerns (status codes, headers)

**Controller Pattern:**

```typescript
export class UserController {
  async createUser(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const result = createUserSchema.safeParse(request.body);
    if (!result.success) {
      throw createError.validationError('Invalid data');
    }

    const user = await userService.createUser(result.data);
    reply.code(201).send({ data: user });
  }
}

export const userController = new UserController();
```

#### `src/routes/`

Contains route definitions and registration:

- **Purpose**: Map HTTP endpoints to controller methods
- **Pattern**: Each route file exports an async function that registers routes
- **Responsibilities**:
  - Define URL paths and HTTP methods
  - Bind controllers to routes
  - Log route registration

**Route Pattern:**

```typescript
export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', userController.getAllUsers.bind(userController));
  app.post('/', userController.createUser.bind(userController));
  // ...

  customLogger.route('GET', '/api/v1/users');
}
```

#### `src/utils/`

Shared utility functions and helpers:

- **`logger.ts`**: Custom logging utilities including ASCII art, colorful console output, and Pino configuration
- **`errors.ts`**: Error handling utilities including custom error classes and global error handler

## Architecture Patterns

### 1. MVC (Model-View-Controller) Pattern

The application follows a modified MVC architecture adapted for API development:

- **Models** (`src/models/`): Define data structures, types, and validation schemas
- **Controllers** (`src/controllers/`): Handle HTTP request/response logic
- **Services** (`src/services/`): Implement business logic (replaces traditional "View" in API context)
- **Routes** (`src/routes/`): Map endpoints to controllers

**Data Flow:**

```
Request → Route → Controller → Service → Model
                     ↓
Response ← Controller ← Service ← Model
```

### 2. Layered Architecture

Clear separation of concerns across layers:

1. **Presentation Layer** (Routes + Controllers): HTTP-specific logic
2. **Business Layer** (Services): Business rules and logic
3. **Data Layer** (Models + Services): Data access and validation

**Benefits:**

- Easy to test each layer independently
- Changes in one layer don't affect others
- Clear responsibilities for each component

### 3. Dependency Injection Pattern

Services and controllers are exported as singleton instances:

```typescript
// service
export const userService = new UserService();

// controller
export const userController = new UserController();

// usage in routes
app.get('/', userController.getAllUsers.bind(userController));
```

### 4. Plugin Architecture

Fastify uses a plugin-based architecture. Routes, middleware, and utilities are registered as plugins:

```typescript
await app.register(cors, {
  /* options */
});
await app.register(sensible);
await app.register(healthRoutes, { prefix: '/health' });
```

### 5. Route Organization

Routes are organized by feature/domain with clear separation of concerns:

- Each route module handles a specific domain (users, auth, products, etc.)
- Routes are registered with versioned API prefixes (`/api/v1`)
- Route modules are self-contained and reusable

### 6. Error Handling

Comprehensive error handling with:

- **Custom Error Classes**: `ApiError` for application-specific errors
- **Error Factory Functions**: Helper functions for common HTTP errors
- **Global Error Handler**: Catches and formats all errors consistently
- **Validation Errors**: Automatic handling of Zod validation failures

### 7. Type Safety

TypeScript is used throughout for:

- Request/response type safety
- Schema validation with Zod
- Route parameter and body typing
- Compile-time error detection
- DTO (Data Transfer Object) types

### 8. Logging Strategy

Two-tier logging approach:

- **Pino Logger**: Structured JSON logging for production, attached to Fastify instance
- **Custom Logger**: Colorful console logging for development visibility and server events

## Configuration Management

### Environment Variables

Configuration is managed through environment variables:

- `.env.example`: Template showing all available variables
- `dotenv`: Loads variables from `.env` file (not committed to git)
- Type-safe access with fallback defaults

### TypeScript Configuration

- Strict mode enabled for maximum type safety
- Path aliases configured for clean imports
- ES modules for modern JavaScript features

## API Design Principles

### 1. RESTful Conventions

- Use appropriate HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Meaningful resource naming
- Proper status codes (200, 201, 400, 404, 500, etc.)

### 2. Consistent Response Format

Successful responses:

```json
{
  "data": {
    /* ... */
  },
  "message": "Optional message"
}
```

Error responses:

```json
{
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "timestamp": "2025-10-07T12:00:00.000Z",
    "path": "/api/v1/resource"
  }
}
```

### 3. Request Validation

- All inputs validated using Zod schemas
- Type-safe request handlers
- Automatic error responses for invalid data

### 4. Documentation

- JSDoc comments on all public functions
- Inline comments for complex logic
- README and documentation files for setup and usage

## Best Practices Implemented

### ✅ MVC Architecture

- Clear separation between models, controllers, and services
- Each layer has a single responsibility
- Easy to test and maintain
- Scalable structure for growing applications

### ✅ Separation of Concerns

- Models define data structure and validation
- Services contain business logic
- Controllers handle HTTP layer
- Routes map endpoints to controllers
- Utilities are modular and reusable
- Configuration is externalized

### ✅ Error Handling

- Operational vs programming errors distinction
- Proper error logging with context
- Consistent error response format
- No silent failures

### ✅ Security

- CORS configuration
- Request ID tracking
- Environment-based configuration
- No sensitive data in logs
- Input validation at multiple layers

### ✅ Performance

- Fastify for high performance
- Pino for fast logging
- Minimal middleware overhead
- Efficient data validation with Zod

### ✅ Developer Experience

- TypeScript for type safety
- Hot reload in development
- Colorful, readable logs
- Clear MVC project structure
- Comprehensive JSDoc documentation

### ✅ Production Ready

- Graceful shutdown handling
- Health check endpoints
- Environment-based config
- Structured logging

## Scaling Considerations

### Adding New Features (MVC Pattern)

Follow these steps to add a new feature:

#### 1. Create the Model

```typescript
// src/models/product.model.ts
import { z } from 'zod';

export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  price: z.number(),
});

export const createProductSchema = productSchema.omit({ id: true });

export type Product = z.infer<typeof productSchema>;
export type CreateProductDto = z.infer<typeof createProductSchema>;
```

#### 2. Create the Service

```typescript
// src/services/product.service.ts
import type { Product, CreateProductDto } from '../models/product.model';

export class ProductService {
  async getAllProducts(): Promise<Product[]> {
    // Business logic
  }

  async createProduct(data: CreateProductDto): Promise<Product> {
    // Business logic
  }
}

export const productService = new ProductService();
```

#### 3. Create the Controller

```typescript
// src/controllers/product.controller.ts
import { productService } from '../services/product.service';
import type { FastifyRequest, FastifyReply } from 'fastify';

export class ProductController {
  async getAllProducts(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const products = await productService.getAllProducts();
    reply.send({ data: products });
  }
}

export const productController = new ProductController();
```

#### 4. Create the Routes

```typescript
// src/routes/product.routes.ts
import { productController } from '../controllers/product.controller';
import type { FastifyInstance } from 'fastify';

export async function productRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', productController.getAllProducts.bind(productController));
  // ... more routes
}
```

#### 5. Register Routes

```typescript
// src/routes/index.ts
import { productRoutes } from './product.routes';

await api.register(productRoutes, { prefix: '/products' });
```

### Adding New Routes (Legacy Pattern)

For simpler features, you can still use the direct route pattern:

1. Create a new file in `src/routes/` (e.g., `simple.routes.ts`)
2. Define your route handlers with proper JSDoc
3. Export the route registration function
4. Register in `src/routes/index.ts`

Example:

```typescript
// src/routes/users.ts
export async function userRoutes(app: FastifyInstance) {
  app.get('/', getAllUsers);
  app.post('/', createUser);
}

// src/routes/index.ts
import { userRoutes } from './users';
await api.register(userRoutes, { prefix: '/users' });
```

### Adding Middleware

Register global middleware in `src/index.ts`:

```typescript
await app.register(yourMiddleware, { options });
```

Route-specific middleware can be added in route files:

```typescript
app.get('/', { preHandler: authMiddleware }, handler);
```

### Working with the MVC Structure

**When to create what:**

- **Model**: When you need a new data entity with validation
- **Service**: When you need business logic that can be reused
- **Controller**: When you need to handle HTTP requests for a feature
- **Route**: When you need to expose an API endpoint

**Directory organization as project grows:**

```
src/
├── models/
│   ├── user.model.ts
│   ├── product.model.ts
│   ├── order.model.ts
│   └── index.ts          # Export all models
├── services/
│   ├── user.service.ts
│   ├── product.service.ts
│   ├── order.service.ts
│   ├── email.service.ts   # Utility services
│   └── index.ts           # Export all services
├── controllers/
│   ├── user.controller.ts
│   ├── product.controller.ts
│   ├── order.controller.ts
│   └── index.ts           # Export all controllers
├── routes/
│   ├── index.ts
│   ├── user.routes.ts
│   ├── product.routes.ts
│   └── order.routes.ts
└── middleware/            # New folder for middleware
    ├── auth.middleware.ts
    └── validation.middleware.ts
```

├── services/
│ ├── user.service.ts
│ ├── auth.service.ts
│ └── email.service.ts

```

### Adding Data Layer

Create repository/model layers:

```

src/
├── models/
│ ├── user.model.ts
│ └── product.model.ts
├── repositories/
│ ├── user.repository.ts
│ └── product.repository.ts

```

## Health Monitoring

Three health check endpoints are provided:

1. **`GET /api/v1/health`** - Comprehensive health check with system info
2. **`GET /api/v1/health/live`** - Liveness probe (is the service running?)
3. **`GET /api/v1/health/ready`** - Readiness probe (can it accept traffic?)

These are designed for container orchestration platforms like Kubernetes.

## Development Workflow

1. **Install dependencies**: `pnpm install`
2. **Copy environment file**: `cp .env.example .env`
3. **Start dev server**: `pnpm dev` (with hot reload)
4. **Run linting**: `pnpm lint`
5. **Type checking**: `pnpm type-check`
6. **Build for production**: `pnpm build`
7. **Start production**: `pnpm start`

## Future Enhancements

Consider adding:

- Database integration (PostgreSQL, MongoDB, etc.)
- Authentication/Authorization middleware
- Rate limiting
- Request caching
- API documentation (Swagger/OpenAPI)
- Testing setup (Jest, Vitest)
- CI/CD pipeline
- Monitoring and metrics (Prometheus, Grafana)
- Database migrations
- Background job processing
```
