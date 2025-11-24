import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  ApiError,
  createError,
  errorHandler,
  notFoundHandler,
} from '../../utils/errors';

import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

describe('Errors - Unit Tests', () => {
  describe('ApiError', () => {
    it('should create ApiError with default values', () => {
      const error = new ApiError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.stack).toBeDefined();
    });

    it('should create ApiError with custom status code', () => {
      const error = new ApiError('Not found', 404);

      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });

    it('should create ApiError with non-operational flag', () => {
      const error = new ApiError('Critical error', 500, false);

      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
    });

    it('should maintain proper stack trace', () => {
      const error = new ApiError('Stack test');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Stack test');
    });
  });

  describe('createError factory', () => {
    it('should create bad request error (400)', () => {
      const error = createError.badRequest('Invalid input');

      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.isOperational).toBe(true);
    });

    it('should create bad request with default message', () => {
      const error = createError.badRequest();

      expect(error.message).toBe('Bad Request');
    });

    it('should create unauthorized error (401)', () => {
      const error = createError.unauthorized('Not authenticated');

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Not authenticated');
    });

    it('should create unauthorized with default message', () => {
      const error = createError.unauthorized();

      expect(error.message).toBe('Unauthorized');
    });

    it('should create forbidden error (403)', () => {
      const error = createError.forbidden('Access denied');

      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Access denied');
    });

    it('should create forbidden with default message', () => {
      const error = createError.forbidden();

      expect(error.message).toBe('Forbidden');
    });

    it('should create not found error (404)', () => {
      const error = createError.notFound('User not found');

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
    });

    it('should create not found with default message', () => {
      const error = createError.notFound();

      expect(error.message).toBe('Resource not found');
    });

    it('should create conflict error (409)', () => {
      const error = createError.conflict('Resource already exists');

      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Resource already exists');
    });

    it('should create conflict with default message', () => {
      const error = createError.conflict();

      expect(error.message).toBe('Conflict');
    });

    it('should create validation error (422)', () => {
      const error = createError.validationError('Invalid email format');

      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('Invalid email format');
    });

    it('should create validation error with default message', () => {
      const error = createError.validationError();

      expect(error.message).toBe('Validation Error');
    });

    it('should create internal server error (500)', () => {
      const error = createError.internal('Database connection failed');

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Database connection failed');
      expect(error.isOperational).toBe(false);
    });

    it('should create internal error with default message', () => {
      const error = createError.internal();

      expect(error.message).toBe('Internal Server Error');
      expect(error.isOperational).toBe(false);
    });
  });

  describe('errorHandler', () => {
    let mockRequest: Partial<FastifyRequest>;
    let mockReply: Partial<FastifyReply>;
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;

      mockRequest = {
        method: 'GET',
        url: '/api/test',
        params: {},
        query: {},
        log: {
          error: vi.fn(),
          warn: vi.fn(),
          info: vi.fn(),
          debug: vi.fn(),
        } as unknown as FastifyRequest['log'],
      };

      mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle ApiError with correct status code', async () => {
      const error = createError.notFound('User not found');

      await errorHandler(
        error as unknown as FastifyError,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'User not found',
            statusCode: 404,
            path: '/api/test',
          }),
        })
      );
    });

    it('should include stack trace in development mode', async () => {
      process.env.NODE_ENV = 'development';
      const error = new ApiError('Test error', 500);

      await errorHandler(
        error as unknown as FastifyError,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            stack: expect.any(String),
          }),
        })
      );
    });

    it('should not include stack trace in production mode', async () => {
      process.env.NODE_ENV = 'production';
      const error = new ApiError('Test error', 500);

      await errorHandler(
        error as unknown as FastifyError,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      const sendCall = (mockReply.send as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      expect(sendCall.error.stack).toBeUndefined();
    });

    it('should handle generic errors with 500 status', async () => {
      const error = new Error('Generic error') as FastifyError;

      await errorHandler(
        error,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(500);
    });

    it('should handle validation errors', async () => {
      const error = {
        message: 'Validation failed',
        validation: [{ field: 'email', message: 'Invalid format' }],
      } as unknown as FastifyError;

      await errorHandler(
        error,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Validation Error',
            validation: expect.any(Array),
          }),
        })
      );
    });

    it('should log errors with appropriate level (500+)', async () => {
      const error = createError.internal('Critical error');

      await errorHandler(
        error as unknown as FastifyError,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockRequest.log?.error).toHaveBeenCalled();
    });

    it('should log warnings with appropriate level (400-499)', async () => {
      const error = createError.badRequest('Invalid input');

      await errorHandler(
        error as unknown as FastifyError,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockRequest.log?.warn).toHaveBeenCalled();
    });

    it('should use error statusCode if provided', async () => {
      const error = { statusCode: 418, message: 'Teapot' } as FastifyError;

      await errorHandler(
        error,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(418);
    });

    it('should include timestamp in error response', async () => {
      const error = createError.badRequest();

      await errorHandler(
        error as unknown as FastifyError,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            timestamp: expect.any(String),
          }),
        })
      );
    });
  });

  describe('notFoundHandler', () => {
    let mockRequest: Partial<FastifyRequest>;
    let mockReply: Partial<FastifyReply>;

    beforeEach(() => {
      mockRequest = {
        method: 'GET',
        url: '/api/nonexistent',
      };

      mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };
    });

    it('should return 404 status code', async () => {
      await notFoundHandler(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.status).toHaveBeenCalledWith(404);
    });

    it('should include route information in error message', async () => {
      await notFoundHandler(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Route GET /api/nonexistent not found',
            statusCode: 404,
          }),
        })
      );
    });

    it('should include timestamp in response', async () => {
      await notFoundHandler(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            timestamp: expect.any(String),
          }),
        })
      );
    });

    it('should include path in response', async () => {
      await notFoundHandler(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            path: '/api/nonexistent',
          }),
        })
      );
    });

    it('should handle POST requests', async () => {
      const postRequest = {
        method: 'POST',
        url: '/api/unknown',
      };

      await notFoundHandler(
        postRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Route POST /api/unknown not found',
          }),
        })
      );
    });
  });
});
