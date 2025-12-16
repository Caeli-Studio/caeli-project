import {
  getDefaultImportance,
  isValidEmail,
  isValidRole,
} from '../utils/helpers';
import { getRoleByName, isValidRoleId } from '../utils/roleHelpers';

import type {
  InviteMemberRequest,
  UpdateMembershipRequest,
} from '../types/database';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Get members of a group
 */
export async function getMembers(
  request: FastifyRequest<{ Params: { group_id: string } }>,
  reply: FastifyReply
) {
  try {
    const { data: members, error } = await request.supabaseClient
      .from('memberships')
      .select(
        `
        *,
        profile:profiles!user_id(*),
        preferences:member_preferences(*)
      `
      )
      .eq('group_id', request.params.group_id)
      .is('left_at', null)
      .order('importance', { ascending: false });

    if (error) {
      request.log.error(error, 'Failed to fetch members');
      return reply.status(400).send({
        success: false,
        error: 'Failed to fetch members',
        message: error.message,
      });
    }

    return reply.send({
      success: true,
      members: members || [],
      total: members?.length || 0,
    });
  } catch (err) {
    request.log.error(err, 'Error in getMembers');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Get a specific member
 */
export async function getMember(
  request: FastifyRequest<{
    Params: { group_id: string; membership_id: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { data: member, error } = await request.supabaseClient
      .from('memberships')
      .select(
        `
        *,
        profile:profiles!user_id(*),
        group:groups!group_id(*),
        preferences:member_preferences(*)
      `
      )
      .eq('id', request.params.membership_id)
      .eq('group_id', request.params.group_id)
      .is('left_at', null)
      .single();

    if (error || !member) {
      return reply.status(404).send({
        success: false,
        error: 'Member not found',
      });
    }

    return reply.send({
      success: true,
      member,
    });
  } catch (err) {
    request.log.error(err, 'Error in getMember');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Invite a member to the group
 */
export async function inviteMember(
  request: FastifyRequest<{
    Params: { group_id: string };
    Body: InviteMemberRequest;
  }>,
  reply: FastifyReply
) {
  try {
    let userId = request.body.user_id;

    // If email provided, look up user by email
    if (request.body.email && !userId) {
      if (!isValidEmail(request.body.email)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid email format',
        });
      }

      const { data: profile } = await request.supabaseClient
        .from('profiles')
        .select('user_id')
        .eq('email', request.body.email)
        .single();

      if (!profile) {
        return reply.status(404).send({
          success: false,
          error: 'User not found',
          message: 'No user found with this email address',
        });
      }

      userId = profile.user_id;
    }

    if (!userId) {
      return reply.status(400).send({
        success: false,
        error: 'User ID or email is required',
      });
    }

    // Check if user is already a member
    const { data: existing } = await request.supabaseClient
      .from('memberships')
      .select('id, left_at')
      .eq('group_id', request.params.group_id)
      .eq('user_id', userId)
      .single();

    if (existing && !existing.left_at) {
      return reply.status(400).send({
        success: false,
        error: 'User is already a member',
      });
    }

    // Determine role_id and role_name
    let roleId = request.body.role_id;
    const roleName = request.body.role_name || 'member';

    // If role_id is provided, validate it
    if (roleId) {
      const isValid = await isValidRoleId(
        request.supabaseClient,
        request.params.group_id,
        roleId
      );
      if (!isValid) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid role_id',
        });
      }
    } else if (roleName) {
      // If only role_name provided, get the role_id
      if (!isValidRole(roleName)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid role',
          message: 'Role must be one of: owner, admin, member, child, guest',
        });
      }

      const role = await getRoleByName(
        request.supabaseClient,
        request.params.group_id,
        roleName
      );

      if (role) {
        roleId = role.id;
      }
    }

    // If user was a member before, reactivate
    if (existing && existing.left_at) {
      const { data: membership, error } = await request.supabaseClient
        .from('memberships')
        .update({
          left_at: null,
          role_id: roleId,
          role_name: roleName,
          importance: request.body.importance || getDefaultImportance(roleName),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        request.log.error(error, 'Failed to reactivate membership');
        return reply.status(400).send({
          success: false,
          error: 'Failed to add member',
          message: error.message,
        });
      }

      return reply.status(201).send({
        success: true,
        member: membership,
        message: 'Member reactivated successfully',
      });
    }

    // Create new membership
    const { data: membership, error } = await request.supabaseClient
      .from('memberships')
      .insert({
        group_id: request.params.group_id,
        user_id: userId,
        role_id: roleId,
        role_name: roleName,
        importance: request.body.importance || getDefaultImportance(roleName),
      })
      .select()
      .single();

    if (error) {
      request.log.error(error, 'Failed to create membership');
      return reply.status(400).send({
        success: false,
        error: 'Failed to add member',
        message: error.message,
      });
    }

    // Send notification to the new member
    await request.supabaseClient.from('notifications').insert({
      membership_id: membership.id,
      type: 'ping',
      data: {
        message: 'You have been added to a group',
        group_id: request.params.group_id,
        added_by: request.membership?.id,
      },
    });

    return reply.status(201).send({
      success: true,
      member: membership,
    });
  } catch (err) {
    request.log.error(err, 'Error in inviteMember');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Update a member's role or permissions
 */
export async function updateMember(
  request: FastifyRequest<{
    Params: { group_id: string; membership_id: string };
    Body: UpdateMembershipRequest;
  }>,
  reply: FastifyReply
) {
  try {
    // Prevent self-modification of role
    if (
      request.params.membership_id === request.membership?.id &&
      (request.body.role_name || request.body.role_id)
    ) {
      return reply.status(400).send({
        success: false,
        error: 'Cannot change your own role',
        message: 'Ask another admin or owner to change your role',
      });
    }

    const updateData: Record<string, unknown> = {};

    // Sanitize role_id (filter 'undefined' string, empty strings, etc.)
    if (
      request.body.role_id === 'undefined' ||
      request.body.role_id === '' ||
      request.body.role_id === null
    ) {
      request.body.role_id = undefined;
    }

    // Handle role_id if provided
    if (request.body.role_id) {
      const isValid = await isValidRoleId(
        request.supabaseClient,
        request.params.group_id,
        request.body.role_id
      );

      if (!isValid) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid role_id',
        });
      }

      updateData.role_id = request.body.role_id;

      // Also get the role_name to keep them in sync
      const { data: role, error: roleError } = await request.supabaseClient
        .from('group_roles')
        .select('name, importance')
        .eq('id', request.body.role_id)
        .eq('group_id', request.params.group_id)
        .single();

      if (roleError || !role) {
        request.log.error(roleError, 'Failed to fetch role details');
        return reply.status(400).send({
          success: false,
          error: 'Role not found in this group',
        });
      }

      updateData.role_name = role.name;
      // Also update importance if the role has a default importance
      if (
        role.importance !== undefined &&
        request.body.importance === undefined
      ) {
        updateData.importance = role.importance;
      }
    } else if (request.body.role_name) {
      // Validate role_name if provided (backward compatibility)
      if (!isValidRole(request.body.role_name)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid role',
          message: 'Role must be one of: owner, admin, member, child, guest',
        });
      }

      // Get the role_id for the role_name
      const role = await getRoleByName(
        request.supabaseClient,
        request.params.group_id,
        request.body.role_name
      );

      if (role) {
        updateData.role_id = role.id;
      }

      updateData.role_name = request.body.role_name;
    }

    if (request.body.importance !== undefined) {
      updateData.importance = request.body.importance;
    }

    if (request.body.custom_permissions) {
      updateData.custom_permissions = request.body.custom_permissions;
    }

    const { data: membership, error } = await request.supabaseClient
      .from('memberships')
      .update(updateData)
      .eq('id', request.params.membership_id)
      .eq('group_id', request.params.group_id)
      .select()
      .single();

    if (error) {
      request.log.error(error, 'Failed to update member');
      return reply.status(400).send({
        success: false,
        error: 'Failed to update member',
        message: error.message,
      });
    }

    // Notify the member about role change
    if (request.body.role_name || request.body.role_id) {
      const notificationData: Record<string, unknown> = {
        new_role: request.body.role_name || updateData.role_name,
      };

      // Only add changed_by if membership exists
      if (request.membership?.id) {
        notificationData.changed_by = request.membership.id;
      }

      await request.supabaseClient.from('notifications').insert({
        membership_id: request.params.membership_id,
        type: 'role_changed',
        data: notificationData,
      });
    }

    return reply.send({
      success: true,
      member: membership,
    });
  } catch (err) {
    request.log.error(err, 'Error in updateMember');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Remove a member from the group
 */
export async function removeMember(
  request: FastifyRequest<{
    Params: { group_id: string; membership_id: string };
  }>,
  reply: FastifyReply
) {
  try {
    // Prevent self-removal
    if (request.params.membership_id === request.membership?.id) {
      return reply.status(400).send({
        success: false,
        error: 'Cannot remove yourself',
        message: 'Use the leave group endpoint instead',
      });
    }

    // Get member info
    const { data: member } = await request.supabaseClient
      .from('memberships')
      .select('role_name')
      .eq('id', request.params.membership_id)
      .single();

    // Prevent removing the last owner
    if (member?.role_name === 'owner') {
      const { data: owners } = await request.supabaseClient
        .from('memberships')
        .select('id')
        .eq('group_id', request.params.group_id)
        .eq('role_name', 'owner')
        .is('left_at', null);

      if (owners && owners.length === 1) {
        return reply.status(400).send({
          success: false,
          error: 'Cannot remove the last owner',
          message: 'Transfer ownership to another member first',
        });
      }
    }

    // Get member's user_id to revoke pending invitations
    const { data: memberData } = await request.supabaseClient
      .from('memberships')
      .select('user_id')
      .eq('id', request.params.membership_id)
      .single();

    // Mark as left
    const { error } = await request.supabaseClient
      .from('memberships')
      .update({ left_at: new Date().toISOString() })
      .eq('id', request.params.membership_id)
      .eq('group_id', request.params.group_id);

    if (error) {
      request.log.error(error, 'Failed to remove member');
      return reply.status(400).send({
        success: false,
        error: 'Failed to remove member',
        message: error.message,
      });
    }

    // Delete any pending invitations for this user in this group
    if (memberData?.user_id) {
      // Get user's pseudo
      const { data: profile } = await request.supabaseClient
        .from('profiles')
        .select('pseudo')
        .eq('user_id', memberData.user_id)
        .single();

      if (profile?.pseudo) {
        // Delete invitation by pseudo for this group
        // This allows re-inviting the same user immediately after removal
        await request.supabaseClient
          .from('invitations')
          .delete()
          .eq('group_id', request.params.group_id)
          .eq('pseudo', profile.pseudo)
          .is('revoked_at', null);
      }
    }

    return reply.send({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (err) {
    request.log.error(err, 'Error in removeMember');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
