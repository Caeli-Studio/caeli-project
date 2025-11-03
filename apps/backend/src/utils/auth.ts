import type { onRequestHookHandler } from 'fastify';

/**
 * Fastify onRequest hook to verify JWT token
 * This hook should be used on routes that require authentication
 *
 * @example
 * ```typescript
 * fastify.get('/protected', {
 *   onRequest: [verifyJWT],
 *   handler: async (request, reply) => {
 *     // Access authenticated user
 *     const user = request.user;
 *     // Access user-authenticated Supabase client
 *     const { data } = await request.supabaseClient.from('table').select('*');
 *     return reply.send(data);
 *   }
 * });
 * ```
 */
export const verifyJWT: onRequestHookHandler = async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
    });
  }
};
