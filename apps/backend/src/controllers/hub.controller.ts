import { generateHubCode, isValidPin, verifyPin } from '../utils/helpers';

import type {
  ConnectToHubRequest,
  CreateHubSessionRequest,
} from '../types/database';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Create a new hub session for a group
 */
export async function createHubSession(
  request: FastifyRequest<{
    Params: { group_id: string };
    Body: CreateHubSessionRequest;
  }>,
  reply: FastifyReply
) {
  try {
    // Check if there's already an active session
    const { data: existingSession } = await request.supabaseClient
      .from('hub_sessions')
      .select('id, code')
      .eq('group_id', request.params.group_id)
      .is('disconnected_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingSession) {
      return reply.send({
        success: true,
        session: existingSession,
        message: 'Active session already exists',
      });
    }

    // Create new session
    const code = generateHubCode(8);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    const { data: session, error } = await request.supabaseClient
      .from('hub_sessions')
      .insert({
        group_id: request.params.group_id,
        device_name: request.body.device_name,
        code,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      request.log.error(error, 'Failed to create hub session');
      return reply.status(400).send({
        success: false,
        error: 'Failed to create hub session',
        message: error.message,
      });
    }

    return reply.status(201).send({
      success: true,
      session: {
        id: session.id,
        code: session.code,
        expires_at: session.expires_at,
        device_name: session.device_name,
      },
    });
  } catch (err) {
    request.log.error(err, 'Error in createHubSession');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Connect to a hub session using code and PIN
 */
export async function connectToHub(
  request: FastifyRequest<{ Body: ConnectToHubRequest }>,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();

    // Validate PIN format
    if (!isValidPin(request.body.pin)) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid PIN format',
        message: 'PIN must be 4-6 digits',
      });
    }

    // Find the session
    const { data: session, error: sessionError } = await request.supabaseClient
      .from('hub_sessions')
      .select('*, group:groups(*)')
      .eq('code', request.body.code)
      .is('disconnected_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return reply.status(404).send({
        success: false,
        error: 'Invalid or expired code',
      });
    }

    // Get user's membership in this group
    const { data: membership } = await request.supabaseClient
      .from('memberships')
      .select('id')
      .eq('group_id', session.group_id)
      .eq('user_id', request.user.sub)
      .is('left_at', null)
      .single();

    if (!membership) {
      return reply.status(403).send({
        success: false,
        error: 'You are not a member of this group',
      });
    }

    // Verify PIN
    const { data: profile } = await request.supabaseClient
      .from('profiles')
      .select('pin_hash')
      .eq('user_id', request.user.sub)
      .single();

    if (!profile?.pin_hash) {
      return reply.status(400).send({
        success: false,
        error: 'No PIN set',
        message: 'Please set a PIN in your profile settings',
      });
    }

    const pinValid = await verifyPin(request.body.pin, profile.pin_hash);

    if (!pinValid) {
      return reply.status(401).send({
        success: false,
        error: 'Incorrect PIN',
      });
    }

    // Update session with connection
    const { error: updateError } = await request.supabaseClient
      .from('hub_sessions')
      .update({
        membership_id: membership.id,
        connected_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (updateError) {
      request.log.error(updateError, 'Failed to connect to hub');
      return reply.status(400).send({
        success: false,
        error: 'Failed to connect to hub',
        message: updateError.message,
      });
    }

    return reply.send({
      success: true,
      message: 'Connected to hub successfully',
      session: {
        id: session.id,
        group: session.group,
      },
    });
  } catch (err) {
    request.log.error(err, 'Error in connectToHub');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Disconnect from a hub session
 */
export async function disconnectFromHub(
  request: FastifyRequest<{ Params: { session_id: string } }>,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();

    // Get session
    const { data: session } = await request.supabaseClient
      .from('hub_sessions')
      .select(
        `
        *,
        membership:memberships(user_id)
      `
      )
      .eq('id', request.params.session_id)
      .is('disconnected_at', null)
      .single();

    if (!session) {
      return reply.status(404).send({
        success: false,
        error: 'Active session not found',
      });
    }

    // Verify user owns the connection
    if (session.membership?.user_id !== request.user.sub) {
      return reply.status(403).send({
        success: false,
        error: 'Not your session',
      });
    }

    const { error } = await request.supabaseClient
      .from('hub_sessions')
      .update({
        disconnected_at: new Date().toISOString(),
        membership_id: null,
      })
      .eq('id', request.params.session_id);

    if (error) {
      request.log.error(error, 'Failed to disconnect from hub');
      return reply.status(400).send({
        success: false,
        error: 'Failed to disconnect',
        message: error.message,
      });
    }

    return reply.send({
      success: true,
      message: 'Disconnected successfully',
    });
  } catch (err) {
    request.log.error(err, 'Error in disconnectFromHub');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Get hub status for a group
 */
export async function getHubStatus(
  request: FastifyRequest<{ Params: { group_id: string } }>,
  reply: FastifyReply
) {
  try {
    const { data: session } = await request.supabaseClient
      .from('hub_sessions')
      .select(
        `
        *,
        group:groups(*),
        connected_member:memberships(
          *,
          profile:profiles(*)
        )
      `
      )
      .eq('group_id', request.params.group_id)
      .is('disconnected_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return reply.send({
        success: true,
        status: 'inactive',
        message: 'No active hub session',
      });
    }

    return reply.send({
      success: true,
      status: session.connected_at ? 'connected' : 'waiting',
      session: {
        id: session.id,
        device_name: session.device_name,
        expires_at: session.expires_at,
        connected_at: session.connected_at,
        connected_member: session.connected_member,
      },
    });
  } catch (err) {
    request.log.error(err, 'Error in getHubStatus');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
