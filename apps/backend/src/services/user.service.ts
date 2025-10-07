import { createError } from '../utils/errors';

import type { CreateUserDto, UpdateUserDto, User } from '../models/user.model';

/**
 * In-memory user storage (replace with database in production)
 */
const users: User[] = [];

/**
 * User Service
 * Contains business logic for user operations
 */
export class UserService {
  /**
   * Get all users
   * @returns {Promise<User[]>} Array of all users
   */
  async getAllUsers(): Promise<User[]> {
    return users;
  }

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise<User>} User object
   * @throws {ApiError} If user not found
   */
  async getUserById(id: string): Promise<User> {
    const user = users.find((u) => u.id === id);

    if (!user) {
      throw createError.notFound(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<User | undefined>} User object or undefined
   */
  async getUserByEmail(email: string): Promise<User | undefined> {
    return users.find((u) => u.email === email);
  }

  /**
   * Create a new user
   * @param {CreateUserDto} userData - User data
   * @returns {Promise<User>} Created user object
   * @throws {ApiError} If user with email already exists
   */
  async createUser(userData: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.getUserByEmail(userData.email);

    if (existingUser) {
      throw createError.conflict('User with this email already exists');
    }

    // Create new user
    const newUser: User = {
      id: crypto.randomUUID(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.push(newUser);

    return newUser;
  }

  /**
   * Update user by ID
   * @param {string} id - User ID
   * @param {UpdateUserDto} updateData - Data to update
   * @returns {Promise<User>} Updated user object
   * @throws {ApiError} If user not found or email already exists
   */
  async updateUser(id: string, updateData: UpdateUserDto): Promise<User> {
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      throw createError.notFound(`User with ID ${id} not found`);
    }

    // If email is being updated, check if it's already taken
    if (updateData.email && updateData.email !== users[userIndex].email) {
      const existingUser = await this.getUserByEmail(updateData.email);
      if (existingUser) {
        throw createError.conflict('Email already in use');
      }
    }

    // Update user
    const updatedUser: User = {
      ...users[userIndex],
      ...updateData,
      updatedAt: new Date(),
    };

    users[userIndex] = updatedUser;

    return updatedUser;
  }

  /**
   * Delete user by ID
   * @param {string} id - User ID
   * @returns {Promise<void>}
   * @throws {ApiError} If user not found
   */
  async deleteUser(id: string): Promise<void> {
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      throw createError.notFound(`User with ID ${id} not found`);
    }

    users.splice(userIndex, 1);
  }

  /**
   * Get total user count
   * @returns {Promise<number>} Total number of users
   */
  async getUserCount(): Promise<number> {
    return users.length;
  }
}

// Export singleton instance
export const userService = new UserService();
