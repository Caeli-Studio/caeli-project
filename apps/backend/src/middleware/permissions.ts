import {
  getClientIP,
  hasPermissionAsync,
  resolveMembershipPermissions,
} from '../utils/helpers';

import type { Membership, Permission } from '../types/database';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Extend FastifyRequest to include membership information
 */
declare module 'fastify' {
  interface FastifyRequest {
    membership?: Membership;
    groupId?: string;
  }
}

/**
 * Middleware to load user's membership in a group
 * Requires the group_id to be in the route params
 */
export async function loadMembership(
  request: FastifyRequest<{ Params: { group_id: string } }>,
  reply: FastifyReply
) {
  try {
    // Verify JWT first
    await request.jwtVerify();

    const { group_id } = request.params;

    if (!group_id) {
      return reply.status(400).send({
        success: false,
        error: 'Group ID is required',
      });
    }

    // Get user's membership in this group
    const { data: membership, error } = await request.supabaseClient
      .from('memberships')
      .select('*')
      .eq('group_id', group_id)
      .eq('user_id', request.user.sub)
      .is('left_at', null)
      .single();

    if (error || !membership) {
      return reply.status(403).send({
        success: false,
        error: 'You are not a member of this group',
      });
    }

    // Attach membership to request
    request.membership = membership;
    request.groupId = group_id;
  } catch (err) {
    request.log.error(err, 'Error in loadMembership middleware');
    return reply.status(500).send({
      success: false,
      error: 'Failed to load membership',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Factory function to create permission check middleware
 */
export function requirePermission(permission: keyof Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.membership) {
      return reply.status(403).send({
        success: false,
        error: 'Membership not loaded',
        message: 'loadMembership middleware must be called first',
      });
    }

    // Use async permission check which can fetch role permissions when needed
    const ok = await hasPermissionAsync(
      request.membership,
      String(permission),
      // supabase client available on request object
      (request as any).supabaseClient
    );

    if (!ok) {
      const permissions = await resolveMembershipPermissions(
        request.membership,
        (request as any).supabaseClient
      );

      return reply.status(403).send({
        success: false,
        error: 'Insufficient permissions',
        message: `You need '${permission}' permission to perform this action`,
        required_permission: permission,
        your_permissions: permissions,
      });
    }
  };
}

/**
 * Middleware to require specific role
 */
export function requireRole(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.membership) {
      return reply.status(403).send({
        success: false,
        error: 'Membership not loaded',
      });
    }

    if (!allowedRoles.includes(request.membership.role_name)) {
      return reply.status(403).send({
        success: false,
        error: 'Insufficient role',
        message: `You need one of these roles: ${allowedRoles.join(', ')}`,
        your_role: request.membership.role_name,
        required_roles: allowedRoles,
      });
    }
  };
}

/**
 * Middleware to require minimum importance level
 */
export function requireImportance(minImportance: number) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.membership) {
      return reply.status(403).send({
        success: false,
        error: 'Membership not loaded',
      });
    }

    if (request.membership.importance < minImportance) {
      return reply.status(403).send({
        success: false,
        error: 'Insufficient importance level',
        message: `Minimum importance level required: ${minImportance}`,
        your_importance: request.membership.importance,
        required_importance: minImportance,
      });
    }
  };
}

/**
 * Middleware to log actions to audit log
 */
export function auditLog(action: string, subjectType: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const originalSend = reply.send;

    reply.send = function (data: unknown) {
      // Only log successful responses
      if (reply.statusCode >= 200 && reply.statusCode < 300) {
        const subjectId = extractSubjectId(request, data);

        // Log asynchronously without blocking response
        setImmediate(async () => {
          try {
            const metadata: Record<string, unknown> = {
              method: request.method,
              url: request.url,
              params: request.params,
              query: request.query,
            };

            await request.server.supabaseClient.from('audit_log').insert({
              group_id: request.groupId,
              actor_membership_id: request.membership?.id,
              action,
              subject_type: subjectType,
              subject_id: subjectId,
              metadata,
              ip_address: getClientIP(request.headers),
              user_agent: request.headers['user-agent'],
            });
          } catch (err) {
            request.log.error(err, 'Failed to write audit log');
          }
        });
      }

      return originalSend.call(reply, data);
    };
  };
}

/**
 * Extract subject ID from request or response
 */
function extractSubjectId(
  request: FastifyRequest,
  data: unknown
): string | undefined {
  // Try to get from params first
  const params = request.params as Record<string, string>;
  if (params.id) return params.id;
  if (params.task_id) return params.task_id;
  if (params.transfer_id) return params.transfer_id;
  if (params.member_id) return params.member_id;

  // Try to get from response data
  if (data && typeof data === 'object' && 'id' in data) {
    return (data as { id: string }).id;
  }

  return undefined;
}

/**
 * Middleware to validate request body against a schema
 */
export function validateBody<T>(validator: (body: unknown) => body is T) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!validator(request.body)) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid request body',
        message: 'Request body does not match expected schema',
      });
    }
  };
}

/**
 * Middleware to rate limit actions per user
 */
export function rateLimit(maxRequests: number, windowMs: number) {
  const requests = new Map<string, number[]>();

  return async (request: FastifyRequest, reply: FastifyReply) => {
    await request.jwtVerify();

    const userId = request.user.sub;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get user's request timestamps
    const userRequests = requests.get(userId) || [];

    // Filter out old requests
    const recentRequests = userRequests.filter(
      (timestamp) => timestamp > windowStart
    );

    if (recentRequests.length >= maxRequests) {
      const oldestRequest = recentRequests[0];
      const resetTime = oldestRequest + windowMs;
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      reply.header('Retry-After', retryAfter.toString());

      return reply.status(429).send({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds`,
        retry_after: retryAfter,
      });
    }

    // Add current request
    recentRequests.push(now);
    requests.set(userId, recentRequests);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      for (const [key, timestamps] of requests.entries()) {
        const filtered = timestamps.filter((t) => t > windowStart);
        if (filtered.length === 0) {
          requests.delete(key);
        } else {
          requests.set(key, filtered);
        }
      }
    }
  };
}
