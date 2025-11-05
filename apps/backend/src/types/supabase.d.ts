import '@fastify/jwt';
import '@psteinroe/fastify-supabase';

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase User payload from JWT
 */
export interface SupabaseJWTUser {
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  email?: string;
  phone?: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  role?: string;
  [key: string]: unknown;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: SupabaseJWTUser;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    /**
     * Supabase client authenticated with the service role
     * Use this for admin operations that require elevated permissions
     */
    supabaseClient: SupabaseClient;
  }

  interface FastifyRequest {
    /**
     * Supabase client authenticated with the user's JWT token
     * Use this for user-scoped operations
     * Available after calling jwtVerify() in a route hook
     */
    supabaseClient: SupabaseClient;
  }
}
