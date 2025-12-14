import { generateInvitationCode, isValidPseudo } from '../utils/helpers';

import type {
  AcceptInvitationRequest,
  CreateInvitationRequest,
} from '../types/database';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Create a new invitation (QR code or pseudo)
 */
export async function createInvitation(
  request: FastifyRequest<{
    Params: { group_id: string };
    Body: CreateInvitationRequest;
  }>,
  reply: FastifyReply
) {
  try {
    const { type, pseudo, expires_in_hours = 168, max_uses = 1 } = request.body; // 168h = 7 days

    // Validate invitation type
    if (type !== 'qr' && type !== 'pseudo') {
      return reply.status(400).send({
        success: false,
        error: 'Invalid invitation type',
        message: 'Type must be either "qr" or "pseudo"',
      });
    }

    // Validate pseudo if type is pseudo
    if (type === 'pseudo') {
      if (!pseudo) {
        return reply.status(400).send({
          success: false,
          error: 'Pseudo required',
          message: 'Pseudo is required for pseudo-based invitations',
        });
      }

      if (!isValidPseudo(pseudo)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid pseudo format',
          message: 'Pseudo must be 3-20 alphanumeric characters or underscores',
        });
      }

      // Check if pseudo exists in profiles
      const { data: profile } = await request.supabaseClient
        .from('profiles')
        .select('user_id, pseudo')
        .eq('pseudo', pseudo)
        .single();

      if (!profile) {
        return reply.status(404).send({
          success: false,
          error: 'Pseudo not found',
          message: `No user found with pseudo "${pseudo}"`,
        });
      }

      // Check if user is already a member
      const { data: existing } = await request.supabaseClient
        .from('memberships')
        .select('id')
        .eq('group_id', request.params.group_id)
        .eq('user_id', profile.user_id)
        .is('left_at', null)
        .single();

      if (existing) {
        return reply.status(400).send({
          success: false,
          error: 'User already a member',
          message: `User with pseudo "${pseudo}" is already a member of this group`,
        });
      }
    }

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expires_in_hours);

    // Create invitation
    const invitationData: Record<string, unknown> = {
      group_id: request.params.group_id,
      created_by: request.membership?.id,
      max_uses,
      current_uses: 0,
      expires_at: expiresAt.toISOString(),
    };

    if (type === 'qr') {
      // Generate unique code
      let code: string;
      let codeExists = true;

      // Try to generate unique code (max 10 attempts)
      for (let i = 0; i < 10; i++) {
        code = generateInvitationCode();
        const { data } = await request.supabaseClient
          .from('invitations')
          .select('id')
          .eq('code', code)
          .single();

        if (!data) {
          codeExists = false;
          invitationData.code = code;
          break;
        }
      }

      if (codeExists) {
        return reply.status(500).send({
          success: false,
          error: 'Failed to generate unique code',
          message: 'Please try again',
        });
      }
    } else {
      invitationData.pseudo = pseudo;
    }

    const { data: invitation, error } = await request.supabaseClient
      .from('invitations')
      .insert(invitationData)
      .select('*')
      .single();

    if (error) {
      request.log.error(error, 'Failed to create invitation');

      // Handle unique constraint violation
      if (error.code === '23505') {
        return reply.status(400).send({
          success: false,
          error: 'Invitation already exists',
          message:
            type === 'pseudo'
              ? `An invitation for "${pseudo}" already exists`
              : 'Code conflict, please try again',
        });
      }

      return reply.status(400).send({
        success: false,
        error: 'Failed to create invitation',
        message: error.message,
      });
    }

    return reply.status(201).send({
      success: true,
      invitation,
    });
  } catch (err) {
    request.log.error(err, 'Error in createInvitation');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Get invitation details (public endpoint for QR code scanning)
 */
export async function getInvitation(
  request: FastifyRequest<{ Params: { code_or_pseudo: string } }>,
  reply: FastifyReply
) {
  try {
    const { code_or_pseudo } = request.params;

    // Try to find by code first
    // Use server client since this is a public endpoint
    let { data: invitation, error } = await request.server.supabaseClient
      .from('invitations')
      .select(
        `
        *,
        group:groups(id, name, type)
      `
      )
      .eq('code', code_or_pseudo)
      .is('revoked_at', null)
      .maybeSingle();

    // If not found by code, try by pseudo
    if (!invitation) {
      const result = await request.server.supabaseClient
        .from('invitations')
        .select(
          `
          *,
          group:groups(id, name, type)
        `
        )
        .eq('pseudo', code_or_pseudo)
        .is('revoked_at', null)
        .maybeSingle();

      invitation = result.data;
      error = result.error;
    }

    if (error || !invitation) {
      return reply.status(404).send({
        success: false,
        error: 'Invitation not found',
        message: 'Invalid or revoked invitation code/pseudo',
      });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return reply.status(410).send({
        success: false,
        error: 'Invitation expired',
        message: 'This invitation has expired',
      });
    }

    // Check if max uses reached
    if (invitation.current_uses >= invitation.max_uses) {
      return reply.status(410).send({
        success: false,
        error: 'Invitation fully used',
        message: 'This invitation has reached its maximum number of uses',
      });
    }

    return reply.send({
      success: true,
      invitation: {
        id: invitation.id,
        group: invitation.group,
        expires_at: invitation.expires_at,
        max_uses: invitation.max_uses,
        current_uses: invitation.current_uses,
      },
    });
  } catch (err) {
    request.log.error(err, 'Error in getInvitation');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Accept an invitation and join the group
 */
export async function acceptInvitation(
  request: FastifyRequest<{
    Params: { code_or_pseudo: string };
    Body: AcceptInvitationRequest;
  }>,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();

    const { code_or_pseudo } = request.params;

    // Ensure user profile exists
    const { data: existingProfile } = await request.supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('user_id', request.user.sub)
      .single();

    if (!existingProfile) {
      request.log.info(`Creating missing profile for user ${request.user.sub}`);

      const { error: profileError } = await request.supabaseClient
        .from('profiles')
        .insert({
          user_id: request.user.sub,
          display_name: request.user.name || request.user.email || 'User',
        });

      if (profileError) {
        request.log.error({ error: profileError }, 'Failed to create profile');
        return reply.status(500).send({
          success: false,
          error: 'Failed to create user profile',
          message: profileError.message,
        });
      }
    }

    // Find invitation - try by code first (unique), then by pseudo (may have duplicates)
    let invitation;
    let invError;

    // First, try to find by code (codes are unique)
    const { data: invitationByCode, error: codeError } =
      await request.supabaseClient
        .from('invitations')
        .select('*')
        .eq('code', code_or_pseudo)
        .is('revoked_at', null)
        .maybeSingle();

    if (invitationByCode) {
      invitation = invitationByCode;
    } else {
      // If not found by code, try by pseudo (may have multiple, take most recent)
      const { data: invitations, error: pseudoError } =
        await request.supabaseClient
          .from('invitations')
          .select('*')
          .eq('pseudo', code_or_pseudo)
          .is('revoked_at', null)
          .order('created_at', { ascending: false })
          .limit(1);

      if (invitations && invitations.length > 0) {
        invitation = invitations[0];
      } else {
        invError = pseudoError || codeError;
      }
    }

    if (invError || !invitation) {
      return reply.status(404).send({
        success: false,
        error: 'Invitation not found',
        message: 'Invalid or revoked invitation',
      });
    }

    // Validate invitation
    if (new Date(invitation.expires_at) < new Date()) {
      return reply.status(410).send({
        success: false,
        error: 'Invitation expired',
      });
    }

    if (invitation.current_uses >= invitation.max_uses) {
      return reply.status(410).send({
        success: false,
        error: 'Invitation fully used',
      });
    }

    // If invitation is by pseudo, verify user has that pseudo
    if (invitation.pseudo) {
      const { data: profile } = await request.supabaseClient
        .from('profiles')
        .select('pseudo')
        .eq('user_id', request.user.sub)
        .single();

      if (!profile || profile.pseudo !== invitation.pseudo) {
        return reply.status(403).send({
          success: false,
          error: 'Unauthorized',
          message: `This invitation is for user with pseudo "${invitation.pseudo}"`,
        });
      }
    }

    // Check if already an active member
    const { data: activeMember } = await request.supabaseClient
      .from('memberships')
      .select('id')
      .eq('group_id', invitation.group_id)
      .eq('user_id', request.user.sub)
      .is('left_at', null)
      .single();

    if (activeMember) {
      return reply.status(400).send({
        success: false,
        error: 'Already a member',
        message: 'You are already a member of this group',
      });
    }

    // Check if user was previously a member (soft-deleted)
    const { data: previousMember } = await request.supabaseClient
      .from('memberships')
      .select('id')
      .eq('group_id', invitation.group_id)
      .eq('user_id', request.user.sub)
      .not('left_at', 'is', null)
      .single();

    let membership;

    if (previousMember) {
      // Reactivate previous membership
      const { data: reactivated, error: reactivateError } =
        await request.supabaseClient
          .from('memberships')
          .update({
            left_at: null,
            role_name: 'member',
            importance: 50,
          })
          .eq('id', previousMember.id)
          .select()
          .single();

      if (reactivateError) {
        request.log.error(reactivateError, 'Failed to reactivate membership');
        return reply.status(400).send({
          success: false,
          error: 'Failed to rejoin group',
          message: reactivateError.message,
        });
      }

      membership = reactivated;
    } else {
      // Create new membership
      const { data: newMembership, error: memberError } =
        await request.supabaseClient
          .from('memberships')
          .insert({
            group_id: invitation.group_id,
            user_id: request.user.sub,
            role_name: 'member',
            importance: 50,
          })
          .select()
          .single();

      if (memberError) {
        request.log.error(memberError, 'Failed to create membership');
        return reply.status(400).send({
          success: false,
          error: 'Failed to join group',
          message: memberError.message,
        });
      }

      membership = newMembership;
    }

    // Increment invitation uses
    await request.supabaseClient
      .from('invitations')
      .update({ current_uses: invitation.current_uses + 1 })
      .eq('id', invitation.id);

    // Send notification to new member
    await request.supabaseClient.from('notifications').insert({
      membership_id: membership.id,
      type: 'ping',
      data: {
        message: 'Welcome to the group!',
        group_id: invitation.group_id,
      },
    });

    return reply.send({
      success: true,
      membership,
      message: 'Successfully joined the group',
    });
  } catch (err) {
    request.log.error(err, 'Error in acceptInvitation');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * List all active invitations for a group
 */
export async function listInvitations(
  request: FastifyRequest<{ Params: { group_id: string } }>,
  reply: FastifyReply
) {
  try {
    const { data: invitations, error } = await request.supabaseClient
      .from('invitations')
      .select(
        `
        *,
        creator:memberships!invitations_created_by_fkey(
          id,
          role_name,
          profile:profiles(display_name, pseudo, avatar_url)
        )
      `
      )
      .eq('group_id', request.params.group_id)
      .is('revoked_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      request.log.error(error, 'Failed to fetch invitations');
      return reply.status(400).send({
        success: false,
        error: 'Failed to fetch invitations',
        message: error.message,
      });
    }

    // Filter out expired invitations
    const activeInvitations = (invitations || []).filter(
      (inv) => new Date(inv.expires_at) > new Date()
    );

    return reply.send({
      success: true,
      invitations: activeInvitations,
      total: activeInvitations.length,
    });
  } catch (err) {
    request.log.error(err, 'Error in listInvitations');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Revoke an invitation
 */
export async function revokeInvitation(
  request: FastifyRequest<{
    Params: { group_id: string; invitation_id: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { data: invitation, error } = await request.supabaseClient
      .from('invitations')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', request.params.invitation_id)
      .eq('group_id', request.params.group_id)
      .select()
      .single();

    if (error || !invitation) {
      return reply.status(404).send({
        success: false,
        error: 'Invitation not found',
      });
    }

    return reply.send({
      success: true,
      message: 'Invitation revoked successfully',
      invitation,
    });
  } catch (err) {
    request.log.error(err, 'Error in revokeInvitation');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Get pending invitations for current user (by pseudo)
 * GET /api/invitations/pending
 */
export async function getPendingInvitations(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.user?.sub;

    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'User ID not found',
      });
    }

    // Get user's pseudo
    const { data: profile } = await request.supabaseClient
      .from('profiles')
      .select('pseudo')
      .eq('user_id', userId)
      .single();

    if (!profile?.pseudo) {
      return reply.send({
        success: true,
        invitations: [],
        message: 'No pseudo set, no invitations available',
      });
    }

    // Get pending invitations for this pseudo
    const { data: invitations, error } = await request.supabaseClient
      .from('invitations')
      .select(
        `
        id,
        pseudo,
        expires_at,
        current_uses,
        max_uses,
        group:groups(id, name, type)
      `
      )
      .eq('pseudo', profile.pseudo)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      request.log.error(error, 'Failed to fetch pending invitations');
      return reply.status(500).send({
        success: false,
        error: 'Database error',
        message: error.message,
      });
    }

    // Filter out fully used invitations
    const availableInvitations = (invitations || []).filter(
      (inv) => inv.current_uses < inv.max_uses
    );

    return reply.send({
      success: true,
      invitations: availableInvitations,
    });
  } catch (err) {
    request.log.error(err, 'Error in getPendingInvitations');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Refuse an invitation by ID
 * POST /api/invitations/:invitation_id/refuse
 */
export async function refuseInvitation(
  request: FastifyRequest<{ Params: { invitation_id: string } }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user?.sub;

    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'User ID not found',
      });
    }

    // Get user's pseudo
    const { data: profile } = await request.supabaseClient
      .from('profiles')
      .select('pseudo')
      .eq('user_id', userId)
      .single();

    if (!profile?.pseudo) {
      return reply.status(400).send({
        success: false,
        error: 'No pseudo set',
        message: 'You must set a pseudo before managing invitations',
      });
    }

    // Get invitation and verify it's for this user
    const { data: invitation, error: fetchError } = await request.supabaseClient
      .from('invitations')
      .select('*, group:groups(id, name, type)')
      .eq('id', request.params.invitation_id)
      .eq('pseudo', profile.pseudo)
      .is('revoked_at', null)
      .single();

    if (fetchError || !invitation) {
      return reply.status(404).send({
        success: false,
        error: 'Invitation not found',
        message: 'Invalid invitation or not addressed to you',
      });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return reply.status(410).send({
        success: false,
        error: 'Invitation expired',
        message: 'This invitation has expired',
      });
    }

    // Revoke the invitation (mark as refused)
    const { error: revokeError } = await request.supabaseClient
      .from('invitations')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', request.params.invitation_id);

    if (revokeError) {
      request.log.error(revokeError, 'Failed to refuse invitation');
      return reply.status(500).send({
        success: false,
        error: 'Database error',
        message: revokeError.message,
      });
    }

    return reply.send({
      success: true,
      message: 'Invitation refused successfully',
    });
  } catch (err) {
    request.log.error(err, 'Error in refuseInvitation');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
