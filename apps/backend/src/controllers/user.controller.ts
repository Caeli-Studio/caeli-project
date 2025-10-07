import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
} from '../models/user.model';
import { userService } from '../services/user.service';
import { createError } from '../utils/errors';

import type {
  CreateUserDto,
  UpdateUserDto,
  UserIdParams,
} from '../models/user.model';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * User Controller
 * Handles HTTP requests and responses for user endpoints
 */
export class UserController {
  /**
   * Get all users
   * @param {FastifyRequest} _request - Fastify request object
   * @param {FastifyReply} reply - Fastify reply object
   */
  async getAllUsers(
    _request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const users = await userService.getAllUsers();
    const count = await userService.getUserCount();

    reply.code(200).send({
      data: users,
      count,
    });
  }

  /**
   * Get user by ID
   * @param {FastifyRequest} request - Fastify request object
   * @param {FastifyReply} reply - Fastify reply object
   */
  async getUserById(
    request: FastifyRequest<{ Params: UserIdParams }>,
    reply: FastifyReply
  ): Promise<void> {
    // Validate params
    const result = userIdSchema.safeParse(request.params);

    if (!result.success) {
      throw createError.badRequest('Invalid user ID format');
    }

    const { id } = result.data;
    const user = await userService.getUserById(id);

    reply.code(200).send({
      data: user,
    });
  }

  /**
   * Create a new user
   * @param {FastifyRequest} request - Fastify request object
   * @param {FastifyReply} reply - Fastify reply object
   */
  async createUser(
    request: FastifyRequest<{ Body: CreateUserDto }>,
    reply: FastifyReply
  ): Promise<void> {
    // Validate request body
    const result = createUserSchema.safeParse(request.body);

    if (!result.success) {
      const errorMessage = result.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      throw createError.validationError(errorMessage);
    }

    const userData = result.data;
    const user = await userService.createUser(userData);

    reply.code(201).send({
      data: user,
      message: 'User created successfully',
    });
  }

  /**
   * Update user by ID
   * @param {FastifyRequest} request - Fastify request object
   * @param {FastifyReply} reply - Fastify reply object
   */
  async updateUser(
    request: FastifyRequest<{ Params: UserIdParams; Body: UpdateUserDto }>,
    reply: FastifyReply
  ): Promise<void> {
    // Validate params
    const paramsResult = userIdSchema.safeParse(request.params);

    if (!paramsResult.success) {
      throw createError.badRequest('Invalid user ID format');
    }

    // Validate body
    const bodyResult = updateUserSchema.safeParse(request.body);

    if (!bodyResult.success) {
      const errorMessage = bodyResult.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      throw createError.validationError(errorMessage);
    }

    const { id } = paramsResult.data;
    const updateData = bodyResult.data;
    const user = await userService.updateUser(id, updateData);

    reply.code(200).send({
      data: user,
      message: 'User updated successfully',
    });
  }

  /**
   * Delete user by ID
   * @param {FastifyRequest} request - Fastify request object
   * @param {FastifyReply} reply - Fastify reply object
   */
  async deleteUser(
    request: FastifyRequest<{ Params: UserIdParams }>,
    reply: FastifyReply
  ): Promise<void> {
    // Validate params
    const result = userIdSchema.safeParse(request.params);

    if (!result.success) {
      throw createError.badRequest('Invalid user ID format');
    }

    const { id } = result.data;
    await userService.deleteUser(id);

    reply.code(200).send({
      message: 'User deleted successfully',
    });
  }
}

// Export singleton instance
export const userController = new UserController();
