import {
  benchmarkSupabaseQuery,
  testSupabaseConnection,
} from '../utils/supabase-health';

import type { FastifyInstance } from 'fastify';

/**
 * Supabase health check routes
 */
export default async function supabaseHealthRoutes(fastify: FastifyInstance) {
  /**
   * Check Supabase connection status
   * GET /api/health/supabase
   */
  fastify.get('/supabase', async (request, reply) => {
    const result = await testSupabaseConnection(fastify.supabaseClient);

    if (result.success) {
      return reply.send({
        status: 'healthy',
        service: 'supabase',
        responseTime: result.responseTime,
        timestamp: new Date().toISOString(),
      });
    }

    return reply.status(503).send({
      status: 'unhealthy',
      service: 'supabase',
      responseTime: result.responseTime,
      error: result.error,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Detailed Supabase connection information
   * GET /api/health/supabase/details
   */
  fastify.get('/supabase/details', async (request, reply) => {
    const startTime = performance.now();

    try {
      const result = await testSupabaseConnection(fastify.supabaseClient);

      const endTime = performance.now();
      const totalTime = Math.round(endTime - startTime);

      return reply.send({
        status: result.success ? 'healthy' : 'unhealthy',
        service: 'supabase',
        connection: {
          url: process.env.SUPABASE_URL,
          connected: result.success,
          responseTime: result.responseTime,
          totalCheckTime: totalTime,
        },
        error: result.error || null,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      const endTime = performance.now();
      const totalTime = Math.round(endTime - startTime);

      return reply.status(503).send({
        status: 'unhealthy',
        service: 'supabase',
        connection: {
          url: process.env.SUPABASE_URL,
          connected: false,
          totalCheckTime: totalTime,
        },
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * Benchmark Supabase query performance
   * GET /api/health/supabase/benchmark?table=your_table&iterations=5
   */
  fastify.get<{
    Querystring: { table?: string; iterations?: string };
  }>('/supabase/benchmark', async (request, reply) => {
    const tableName = request.query.table || 'users';
    const iterations = Number.parseInt(request.query.iterations || '5', 10);

    if (iterations > 20) {
      return reply.status(400).send({
        error: 'Too many iterations requested',
        message: 'Maximum 20 iterations allowed',
      });
    }

    try {
      const benchmark = await benchmarkSupabaseQuery(
        fastify.supabaseClient,
        tableName,
        iterations
      );

      return reply.send({
        status: 'completed',
        table: tableName,
        iterations,
        results: {
          averageTime: benchmark.averageTime,
          minTime: benchmark.minTime,
          maxTime: benchmark.maxTime,
          allResults: benchmark.results,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return reply.status(500).send({
        status: 'failed',
        table: tableName,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  });
}
