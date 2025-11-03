import fastifyJWT from '@fastify/jwt';
import fastifySupabase from '@psteinroe/fastify-supabase';

import { logSupabaseConnectionDetails } from '../utils/supabase-health';

import type { FastifyInstance } from 'fastify';

/**
 * Supabase configuration from environment variables
 */
export const supabaseConfig = {
  url: process.env.SUPABASE_URL || '',
  anonKey: process.env.SUPABASE_ANON_KEY || '',
  serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  jwtSecret: process.env.SUPABASE_JWT_SECRET || '',
};

/**
 * Validates that all required Supabase environment variables are set
 * @throws {Error} If any required environment variable is missing
 */
export function validateSupabaseConfig(): void {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_JWT_SECRET',
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Supabase environment variables: ${missingVars.join(', ')}`
    );
  }
}

/**
 * Registers Supabase plugin with Fastify
 * @param {FastifyInstance} app - The Fastify application instance
 */
export async function registerSupabase(app: FastifyInstance): Promise<void> {
  // Validate configuration before registering
  validateSupabaseConfig();

  // Register @fastify/jwt with Supabase JWT secret
  await app.register(fastifyJWT, {
    secret: supabaseConfig.jwtSecret,
  });

  // Register Supabase plugin
  await app.register(fastifySupabase, {
    url: supabaseConfig.url,
    anonKey: supabaseConfig.anonKey,
    serviceKey: supabaseConfig.serviceKey,
    options: {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    },
  });

  // Test Supabase connection and log response time
  await logSupabaseConnectionDetails(app.supabaseClient, 'service');
}
