import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { customLogger } from '../../utils/logger';
import {
  testSupabaseConnection,
  logSupabaseConnectionDetails,
  benchmarkSupabaseQuery,
} from '../../utils/supabase-health';

import type { SupabaseClient } from '@supabase/supabase-js';

vi.mock('../../utils/logger', () => ({
  customLogger: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Supabase Health - Unit Tests', () => {
  let mockSupabaseClient: Partial<SupabaseClient>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockSupabaseClient = {
      auth: {
        getSession: vi.fn(),
      } as unknown as SupabaseClient['auth'],
      from: vi.fn(),
    };
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('testSupabaseConnection', () => {
    it('should return success when connection works', async () => {
      (
        mockSupabaseClient.auth!.getSession as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await testSupabaseConnection(
        mockSupabaseClient as SupabaseClient
      );

      expect(result.success).toBe(true);
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
      expect(customLogger.success).toHaveBeenCalledWith(
        expect.stringContaining('Supabase connected successfully')
      );
    });

    it('should return failure when connection fails', async () => {
      const testError = new Error('Connection timeout');
      (
        mockSupabaseClient.auth!.getSession as ReturnType<typeof vi.fn>
      ).mockRejectedValue(testError);

      const result = await testSupabaseConnection(
        mockSupabaseClient as SupabaseClient
      );

      expect(result.success).toBe(false);
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.error).toBe('Connection timeout');
      expect(customLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Supabase connection failed'),
        expect.any(Error)
      );
    });

    it('should handle non-Error objects', async () => {
      (
        mockSupabaseClient.auth!.getSession as ReturnType<typeof vi.fn>
      ).mockRejectedValue('string error');

      const result = await testSupabaseConnection(
        mockSupabaseClient as SupabaseClient
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });

    it('should measure response time accurately', async () => {
      (
        mockSupabaseClient.auth!.getSession as ReturnType<typeof vi.fn>
      ).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ data: { session: null }, error: null }),
              50
            )
          )
      );

      const result = await testSupabaseConnection(
        mockSupabaseClient as SupabaseClient
      );

      expect(result.responseTime).toBeGreaterThanOrEqual(40);
    });
  });

  describe('logSupabaseConnectionDetails', () => {
    it('should log successful service role connection', async () => {
      (
        mockSupabaseClient.auth!.getSession as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await logSupabaseConnectionDetails(
        mockSupabaseClient as SupabaseClient,
        'service'
      );

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => call.join(' '))
        .join(' ');
      expect(output).toContain('SERVICE');
      expect(output).toContain('Connected');
    });

    it('should log successful user role connection', async () => {
      (
        mockSupabaseClient.auth!.getSession as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await logSupabaseConnectionDetails(
        mockSupabaseClient as SupabaseClient,
        'user'
      );

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => call.join(' '))
        .join(' ');
      expect(output).toContain('USER');
    });

    it('should log failed connection with error details', async () => {
      (
        mockSupabaseClient.auth!.getSession as ReturnType<typeof vi.fn>
      ).mockRejectedValue(new Error('Authentication failed'));

      await logSupabaseConnectionDetails(
        mockSupabaseClient as SupabaseClient,
        'service'
      );

      expect(customLogger.error).toHaveBeenCalled();
    });

    it('should default to service role when no type provided', async () => {
      (
        mockSupabaseClient.auth!.getSession as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await logSupabaseConnectionDetails(mockSupabaseClient as SupabaseClient);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls
        .map((call: unknown[]) => call.join(' '))
        .join(' ');
      expect(output).toContain('SERVICE');
    });
  });

  describe('benchmarkSupabaseQuery', () => {
    beforeEach(() => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (mockSupabaseClient.from as ReturnType<typeof vi.fn>) = vi
        .fn()
        .mockReturnValue(mockQueryBuilder);
    });

    it('should run benchmark with default 5 iterations', async () => {
      const result = await benchmarkSupabaseQuery(
        mockSupabaseClient as SupabaseClient,
        'test_table'
      );

      expect(result.results).toHaveLength(5);
      expect(result.averageTime).toBeGreaterThanOrEqual(0);
      expect(result.minTime).toBeGreaterThanOrEqual(0);
      expect(result.maxTime).toBeGreaterThanOrEqual(0);
      expect(customLogger.info).toHaveBeenCalled();
    });

    it('should run benchmark with custom iterations', async () => {
      const result = await benchmarkSupabaseQuery(
        mockSupabaseClient as SupabaseClient,
        'test_table',
        3
      );

      expect(result.results).toHaveLength(3);
    });

    it('should calculate correct average time', async () => {
      const result = await benchmarkSupabaseQuery(
        mockSupabaseClient as SupabaseClient,
        'test_table',
        5
      );

      const expectedAverage = Math.round(
        result.results.reduce((a, b) => a + b, 0) / result.results.length
      );
      expect(result.averageTime).toBe(expectedAverage);
    });

    it('should calculate correct min and max times', async () => {
      const result = await benchmarkSupabaseQuery(
        mockSupabaseClient as SupabaseClient,
        'test_table',
        5
      );

      expect(result.minTime).toBe(Math.min(...result.results));
      expect(result.maxTime).toBe(Math.max(...result.results));
    });

    it('should handle query failures gracefully', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockRejectedValue(new Error('Query failed')),
      };

      (mockSupabaseClient.from as ReturnType<typeof vi.fn>) = vi
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await benchmarkSupabaseQuery(
        mockSupabaseClient as SupabaseClient,
        'test_table',
        2
      );

      expect(result.results).toHaveLength(2);
      expect(customLogger.warn).toHaveBeenCalled();
    });

    it('should log benchmark progress', async () => {
      await benchmarkSupabaseQuery(
        mockSupabaseClient as SupabaseClient,
        'test_table',
        3
      );

      const infoCall = customLogger.info as ReturnType<typeof vi.fn>;
      expect(infoCall).toHaveBeenCalledWith(
        expect.stringContaining('Running 3 benchmark queries')
      );
    });

    it('should log individual query times', async () => {
      await benchmarkSupabaseQuery(
        mockSupabaseClient as SupabaseClient,
        'test_table',
        2
      );

      const infoCall = customLogger.info as ReturnType<typeof vi.fn>;
      expect(infoCall).toHaveBeenCalledWith(
        expect.stringContaining('Query 1/2')
      );
      expect(infoCall).toHaveBeenCalledWith(
        expect.stringContaining('Query 2/2')
      );
    });

    it('should log benchmark results summary', async () => {
      await benchmarkSupabaseQuery(
        mockSupabaseClient as SupabaseClient,
        'test_table',
        3
      );

      const infoCall = customLogger.info as ReturnType<typeof vi.fn>;
      expect(infoCall).toHaveBeenCalledWith(
        expect.stringContaining('Benchmark Results')
      );
    });
  });
});
