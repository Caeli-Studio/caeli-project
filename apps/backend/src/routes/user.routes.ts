import { userController } from '../controllers/user.controller';
import { customLogger } from '../utils/logger';

import type { FastifyInstance } from 'fastify';

/**
 * User Routes
 * Defines all user-related endpoints
 * @param {FastifyInstance} app - The Fastify application instance
 */
export async function userRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/users - Get all users
  app.get('/', userController.getAllUsers.bind(userController));

  // GET /api/v1/users/:id - Get user by ID
  app.get('/:id', userController.getUserById.bind(userController));

  // POST /api/v1/users - Create a new user
  app.post('/', userController.createUser.bind(userController));

  // PUT /api/v1/users/:id - Update user by ID
  app.put('/:id', userController.updateUser.bind(userController));

  // DELETE /api/v1/users/:id - Delete user by ID
  app.delete('/:id', userController.deleteUser.bind(userController));

  // Log registered routes
  customLogger.route('GET', '/api/users');
  customLogger.route('GET', '/api/users/:id');
  customLogger.route('POST', '/api/users');
  customLogger.route('PUT', '/api/users/:id');
  customLogger.route('DELETE', '/api/users/:id');
}
