/**
 * Push Token Controller
 *
 * Handles registration and deletion of Expo push notification tokens
 */

import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Register a new push token for the authenticated user
 *
 * POST /api/push-token
 * Body: { token: string }
 *
 * Adds an Expo push token to the user's profile. Supports multiple tokens
 * per user (for multiple devices).
 */
export async function registerPushToken(
  request: FastifyRequest<{ Body: { token: string } }>,
  reply: FastifyReply
) {
  try {
    // Verify JWT authentication
    await request.jwtVerify();
    const { token } = request.body;

    // Validate token presence
    if (!token) {
      return reply.status(400).send({
        error: 'Push token is required',
      });
    }

    // Get current push tokens from profile
    const { data: profile, error: fetchError } = await request.supabaseClient
      .from('profiles')
      .select('push_tokens')
      .eq('user_id', request.user.sub)
      .single();

    if (fetchError) {
      request.log.error(fetchError, 'Error fetching profile');
      return reply.status(500).send({
        error: 'Failed to fetch profile',
      });
    }

    // Get existing tokens array (default to empty array)
    const currentTokens: string[] = (profile?.push_tokens as string[]) || [];

    // Only add token if not already present (avoid duplicates)
    if (!currentTokens.includes(token)) {
      const updatedTokens = [...currentTokens, token];

      // Update profile with new token
      const { error: updateError } = await request.supabaseClient
        .from('profiles')
        .update({ push_tokens: updatedTokens })
        .eq('user_id', request.user.sub);

      if (updateError) {
        request.log.error(updateError, 'Error updating push tokens');
        return reply.status(500).send({
          error: 'Failed to register push token',
        });
      }

      request.log.info(
        { userId: request.user.sub, token },
        'Push token registered'
      );
    } else {
      request.log.info(
        { userId: request.user.sub, token },
        'Push token already registered'
      );
    }

    return reply.send({ success: true });
  } catch (err) {
    request.log.error(err, 'Unexpected error in registerPushToken');
    return reply.status(500).send({
      error: 'Failed to register push token',
    });
  }
}

/**
 * Delete a push token for the authenticated user
 *
 * DELETE /api/push-token
 * Body: { token: string }
 *
 * Removes an Expo push token from the user's profile.
 * Used when user logs out or uninstalls the app.
 */
export async function deletePushToken(
  request: FastifyRequest<{ Body: { token: string } }>,
  reply: FastifyReply
) {
  try {
    // Verify JWT authentication
    await request.jwtVerify();
    const { token } = request.body;

    // Validate token presence
    if (!token) {
      return reply.status(400).send({
        error: 'Push token is required',
      });
    }

    // Get current push tokens from profile
    const { data: profile, error: fetchError } = await request.supabaseClient
      .from('profiles')
      .select('push_tokens')
      .eq('user_id', request.user.sub)
      .single();

    if (fetchError) {
      request.log.error(fetchError, 'Error fetching profile');
      return reply.status(500).send({
        error: 'Failed to fetch profile',
      });
    }

    // Get existing tokens array
    const currentTokens: string[] = (profile?.push_tokens as string[]) || [];

    // Filter out the token to be deleted
    const updatedTokens = currentTokens.filter((t) => t !== token);

    // Update profile with filtered tokens
    const { error: updateError } = await request.supabaseClient
      .from('profiles')
      .update({ push_tokens: updatedTokens })
      .eq('user_id', request.user.sub);

    if (updateError) {
      request.log.error(updateError, 'Error updating push tokens');
      return reply.status(500).send({
        error: 'Failed to delete push token',
      });
    }

    request.log.info({ userId: request.user.sub, token }, 'Push token deleted');

    return reply.send({ success: true });
  } catch (err) {
    request.log.error(err, 'Unexpected error in deletePushToken');
    return reply.status(500).send({
      error: 'Failed to delete push token',
    });
  }
}
