import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

/**
 * Custom API Error class for handling application-specific errors
 */
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  /**
   * Creates a new ApiError instance
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {boolean} isOperational - Whether the error is operational (default: true)
   */
  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common API error factory functions
 */
export const createError = {
  /**
   * Creates a Bad Request error (400)
   * @param {string} message - Error message
   * @returns {ApiError} API Error instance
   */
  badRequest(message = 'Bad Request'): ApiError {
    return new ApiError(message, 400);
  },

  /**
   * Creates an Unauthorized error (401)
   * @param {string} message - Error message
   * @returns {ApiError} API Error instance
   */
  unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(message, 401);
  },

  /**
   * Creates a Forbidden error (403)
   * @param {string} message - Error message
   * @returns {ApiError} API Error instance
   */
  forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(message, 403);
  },

  /**
   * Creates a Not Found error (404)
   * @param {string} message - Error message
   * @returns {ApiError} API Error instance
   */
  notFound(message = 'Resource not found'): ApiError {
    return new ApiError(message, 404);
  },

  /**
   * Creates a Conflict error (409)
   * @param {string} message - Error message
   * @returns {ApiError} API Error instance
   */
  conflict(message = 'Conflict'): ApiError {
    return new ApiError(message, 409);
  },

  /**
   * Creates a Validation error (422)
   * @param {string} message - Error message
   * @returns {ApiError} API Error instance
   */
  validationError(message = 'Validation Error'): ApiError {
    return new ApiError(message, 422);
  },

  /**
   * Creates an Internal Server error (500)
   * @param {string} message - Error message
   * @returns {ApiError} API Error instance
   */
  internal(message = 'Internal Server Error'): ApiError {
    return new ApiError(message, 500, false);
  },
};

/**
 * Error response interface
 */
interface ErrorResponse {
  error: {
    message: string;
    statusCode: number;
    timestamp: string;
    path?: string;
    stack?: string;
  };
}

/**
 * Global error handler for Fastify
 * Handles both operational and programming errors
 * @param {FastifyError} error - The error object
 * @param {FastifyRequest} request - Fastify request object
 * @param {FastifyReply} reply - Fastify reply object
 */
export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Default to 500 server error
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Handle ApiError instances
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // Handle validation errors (from Zod or other validators)
  if (error.validation) {
    statusCode = 400;
    message = 'Validation Error';
  }

  // Log the error
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  request.log[logLevel]({
    err: error,
    req: {
      method: request.method,
      url: request.url,
      params: request.params,
      query: request.query,
    },
    statusCode,
  });

  // Build error response
  const errorResponse: ErrorResponse = {
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    },
  };

  // Include stack trace in development mode
  if (isDevelopment && error.stack) {
    errorResponse.error.stack = error.stack;
  }

  // Include validation details if available
  if (error.validation) {
    Object.assign(errorResponse.error, {
      validation: error.validation,
    });
  }

  reply.status(statusCode).send(errorResponse);
}

/**
 * Not Found handler for undefined routes
 * @param {FastifyRequest} request - Fastify request object
 * @param {FastifyReply} reply - Fastify reply object
 */
export async function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  reply.status(404).send({
    error: {
      message: `Route ${request.method} ${request.url} not found`,
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: request.url,
    },
  });
}
