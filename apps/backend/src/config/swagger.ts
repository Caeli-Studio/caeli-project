import type { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import type { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

/**
 * Swagger/OpenAPI configuration for API documentation
 */
export const swaggerOptions: FastifyDynamicSwaggerOptions = {
  mode: 'dynamic',
  openapi: {
    info: {
      title: 'Caeli API',
      description: `
# 🏠 Caeli API - Household Task Management

Complete REST API for managing household tasks, groups, and member coordination.

## Features

- 👥 User profiles and authentication (Google OAuth)
- 🏠 Household group management
- ✅ Task creation, assignment, and completion
- 🔄 Task transfers and exchanges between members
- 🔔 Real-time notifications
- 📺 Shared hub/monitor display
- 📅 Calendar integration (Google/Apple)
- 🔐 Role-based access control
- 📊 Complete audit logging

## Authentication

All endpoints (except auth endpoints) require a valid JWT token in the Authorization header:

\`\`\`
Authorization: Bearer YOUR_JWT_TOKEN
\`\`\`

Get your token by authenticating through the Google OAuth endpoints.

## Roles & Permissions

| Role | Priority | Permissions |
|------|----------|-------------|
| owner | 100 | Full control over group |
| admin | 80 | Manage members and tasks |
| member | 50 | Create and complete tasks |
| child | 30 | Complete assigned tasks |
| guest | 10 | View only |
      `,
      version: '1.0.0',
      contact: {
        name: 'Caeli API Support',
        email: 'support@caeli.app',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.caeli.app',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Profile',
        description: 'User profile management',
      },
      {
        name: 'Groups',
        description: 'Household group operations',
      },
      {
        name: 'Memberships',
        description: 'Group member management',
      },
      {
        name: 'Tasks',
        description: 'Task creation, assignment, and completion',
      },
      {
        name: 'Transfers',
        description: 'Task transfer and exchange requests',
      },
      {
        name: 'Notifications',
        description: 'User notifications',
      },
      {
        name: 'Hub',
        description: 'Shared monitor/display management',
      },
      {
        name: 'Health',
        description: 'Service health checks',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from authentication endpoints',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        Profile: {
          type: 'object',
          properties: {
            user_id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            display_name: { type: 'string' },
            avatar_url: { type: 'string', format: 'uri', nullable: true },
            pin: { type: 'string', minLength: 4, maxLength: 6 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Group: {
          type: 'object',
          properties: {
            group_id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            created_by: { type: 'string', format: 'uuid' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Membership: {
          type: 'object',
          properties: {
            membership_id: { type: 'string', format: 'uuid' },
            group_id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            role: {
              type: 'string',
              enum: ['owner', 'admin', 'member', 'child', 'guest'],
            },
            joined_at: { type: 'string', format: 'date-time' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            task_id: { type: 'string', format: 'uuid' },
            group_id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: {
              type: 'string',
              enum: ['open', 'done', 'cancelled'],
              default: 'open',
            },
            is_free: { type: 'boolean', default: false },
            created_by: { type: 'string', format: 'uuid' },
            due_at: { type: 'string', format: 'date-time', nullable: true },
            completed_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            completed_by: { type: 'string', format: 'uuid', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        TaskTransfer: {
          type: 'object',
          properties: {
            transfer_id: { type: 'string', format: 'uuid' },
            task_id: { type: 'string', format: 'uuid' },
            from_membership_id: { type: 'string', format: 'uuid' },
            to_membership_id: { type: 'string', format: 'uuid' },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'refused', 'cancelled'],
            },
            message: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            responded_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            notification_id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            type: {
              type: 'string',
              enum: [
                'task_reminder',
                'transfer_request',
                'ping',
                'task_assigned',
                'task_completed',
                'role_changed',
              ],
            },
            title: { type: 'string' },
            message: { type: 'string' },
            is_read: { type: 'boolean', default: false },
            action_url: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        HubSession: {
          type: 'object',
          properties: {
            session_id: { type: 'string', format: 'uuid' },
            group_id: { type: 'string', format: 'uuid' },
            code: { type: 'string' },
            device_name: { type: 'string' },
            connected_user_id: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            is_active: { type: 'boolean' },
            expires_at: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
};

/**
 * Swagger UI configuration
 */
export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai',
    },
  },
  staticCSP: true,
};
