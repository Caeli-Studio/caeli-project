import { z } from 'zod';

/**
 * User schema for validation and type inference
 */
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().int().min(18).max(120).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Schema for creating a new user (excludes id and timestamps)
 */
export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().int().min(18).max(120).optional(),
});

/**
 * Schema for updating a user
 */
export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  age: z.number().int().min(18).max(120).optional(),
});

/**
 * Schema for user ID parameter
 */
export const userIdSchema = z.object({
  id: z.string().uuid(),
});

/**
 * User type inferred from schema
 */
export type User = z.infer<typeof userSchema>;

/**
 * Create user DTO type
 */
export type CreateUserDto = z.infer<typeof createUserSchema>;

/**
 * Update user DTO type
 */
export type UpdateUserDto = z.infer<typeof updateUserSchema>;

/**
 * User ID params type
 */
export type UserIdParams = z.infer<typeof userIdSchema>;
