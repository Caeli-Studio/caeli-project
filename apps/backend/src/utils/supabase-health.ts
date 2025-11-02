import { customLogger } from './logger';

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Test Supabase connection and measure response time
 * @param client - Supabase client instance
 * @returns Object containing connection status and timing
 */
export async function testSupabaseConnection(client: SupabaseClient): Promise<{
  success: boolean;
  responseTime: number;
  error?: string;
}> {
  const startTime = performance.now();

  try {
    // Simple query to test connection - just try to query from any system table
    // We'll use a simple REST API health check instead
    await client.auth.getSession();

    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    // If we can query auth session, connection is working
    // (even if there's no session, the connection itself works)
    customLogger.success(
      `✓ Supabase connected successfully (${responseTime}ms)`
    );

    return {
      success: true,
      responseTime,
    };
  } catch (err) {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    customLogger.error(
      `Supabase connection failed: ${errorMessage}`,
      err instanceof Error ? err : new Error(errorMessage)
    );

    return {
      success: false,
      responseTime,
      error: errorMessage,
    };
  }
}

/**
 * Log detailed Supabase connection information
 * @param client - Supabase client instance
 * @param clientType - Type of client (service or user)
 */
export async function logSupabaseConnectionDetails(
  client: SupabaseClient,
  clientType: 'service' | 'user' = 'service'
): Promise<void> {
  const result = await testSupabaseConnection(client);

  if (result.success) {
    // Use clean console.log for success
    console.log('┌─────────────────────────────────────────┐');
    console.log(`│ ✅ Supabase ${clientType.toUpperCase()} Role Connected   │`);
    console.log(`│ Response Time: ${result.responseTime}ms`.padEnd(42) + '│');
    console.log(`│ Status: Healthy`.padEnd(42) + '│');
    console.log('└─────────────────────────────────────────┘');
  } else {
    // Use customLogger for errors
    customLogger.error('┌─────────────────────────────────────────┐');
    customLogger.error(
      `│ ✗ Supabase ${clientType.toUpperCase()} Role Failed      │`
    );
    customLogger.error(
      `│ Response Time: ${result.responseTime}ms`.padEnd(42) + '│'
    );
    customLogger.error(
      `│ Error: ${result.error?.substring(0, 30)}...`.padEnd(42) + '│'
    );
    customLogger.error('└─────────────────────────────────────────┘');
  }
}

/**
 * Benchmark Supabase query performance
 * @param client - Supabase client instance
 * @param tableName - Table to query
 * @param iterations - Number of iterations to run
 */
export async function benchmarkSupabaseQuery(
  client: SupabaseClient,
  tableName: string,
  iterations: number = 5
): Promise<{
  averageTime: number;
  minTime: number;
  maxTime: number;
  results: number[];
}> {
  const times: number[] = [];

  customLogger.info(
    `Running ${iterations} benchmark queries on '${tableName}'...`
  );

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();

    try {
      await client.from(tableName).select('*').limit(1);

      const endTime = performance.now();
      const queryTime = Math.round(endTime - startTime);
      times.push(queryTime);

      customLogger.info(`Query ${i + 1}/${iterations}: ${queryTime}ms`);
    } catch {
      const endTime = performance.now();
      const queryTime = Math.round(endTime - startTime);
      times.push(queryTime);

      customLogger.warn(
        `Query ${i + 1}/${iterations}: ${queryTime}ms (failed)`
      );
    }
  }

  const averageTime = Math.round(
    times.reduce((a, b) => a + b, 0) / times.length
  );
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  customLogger.info('┌─────────────────────────────────────────┐');
  customLogger.info(`│ Benchmark Results for '${tableName}'`.padEnd(42) + '│');
  customLogger.info('├─────────────────────────────────────────┤');
  customLogger.info(`│ Average: ${averageTime}ms`.padEnd(42) + '│');
  customLogger.info(`│ Min: ${minTime}ms`.padEnd(42) + '│');
  customLogger.info(`│ Max: ${maxTime}ms`.padEnd(42) + '│');
  customLogger.info('└─────────────────────────────────────────┘');

  return {
    averageTime,
    minTime,
    maxTime,
    results: times,
  };
}
