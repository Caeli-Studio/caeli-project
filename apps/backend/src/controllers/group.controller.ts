import type {
  CreateGroupRequest,
  GroupResponse,
  UpdateGroupRequest,
} from '../types/database';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Create a new group
 */
export async function createGroup(
  request: FastifyRequest<{ Body: CreateGroupRequest }>,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();

    // Create the group
    const { data: group, error: groupError } = await request.supabaseClient
      .from('groups')
      .insert({
        name: request.body.name,
        type: request.body.type || 'family',
      })
      .select()
      .single();

    if (groupError || !group) {
      request.log.error(groupError, 'Failed to create group');
      return reply.status(400).send({
        success: false,
        error: 'Failed to create group',
        message: groupError?.message,
      });
    }

    // Add creator as owner
    const { data: membership, error: membershipError } =
      await request.supabaseClient
        .from('memberships')
        .insert({
          group_id: group.id,
          user_id: request.user.sub,
          role_name: 'owner',
          importance: 100,
        })
        .select()
        .single();

    if (membershipError) {
      request.log.error(membershipError, 'Failed to create owner membership');
      // Rollback: delete the group
      await request.supabaseClient.from('groups').delete().eq('id', group.id);

      return reply.status(400).send({
        success: false,
        error: 'Failed to create group membership',
        message: membershipError.message,
      });
    }

    return reply.status(201).send({
      success: true,
      data: {
        group,
        membership,
      },
      message: 'Foyer créé avec succès',
    });
  } catch (err) {
    request.log.error(err, 'Error in createGroup');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Get user's groups
 */
export async function getMyGroups(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();

    const { data: memberships, error } = await request.supabaseClient
      .from('memberships')
      .select(
        `
        *,
        group:groups(*)
      `
      )
      .eq('user_id', request.user.sub)
      .is('left_at', null);

    if (error) {
      request.log.error(error, 'Failed to fetch groups');
      return reply.status(400).send({
        success: false,
        error: 'Failed to fetch groups',
        message: error.message,
      });
    }

    // Count members for each group
    const groups: GroupResponse[] = await Promise.all(
      (memberships || []).map(async (membership) => {
        const { count } = await request.supabaseClient
          .from('memberships')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', membership.group.id)
          .is('left_at', null);

        return {
          ...membership.group,
          my_membership: membership,
          member_count: count || 0,
        };
      })
    );

    return reply.send({
      success: true,
      groups,
    });
  } catch (err) {
    request.log.error(err, 'Error in getMyGroups');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Get a specific group
 */
export async function getGroup(
  request: FastifyRequest<{ Params: { group_id: string } }>,
  reply: FastifyReply
) {
  try {
    const { data: group, error } = await request.supabaseClient
      .from('groups')
      .select('*')
      .eq('id', request.params.group_id)
      .single();

    if (error || !group) {
      return reply.status(404).send({
        success: false,
        error: 'Group not found',
      });
    }

    // Get members
    const { data: members } = await request.supabaseClient
      .from('memberships')
      .select(
        `
        *,
        profile:profiles(*)
      `
      )
      .eq('group_id', group.id)
      .is('left_at', null)
      .order('importance', { ascending: false });

    const response: GroupResponse = {
      ...group,
      members: members || [],
      member_count: members?.length || 0,
      my_membership: request.membership,
    };

    return reply.send({
      success: true,
      group: response,
    });
  } catch (err) {
    request.log.error(err, 'Error in getGroup');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Update a group
 */
export async function updateGroup(
  request: FastifyRequest<{
    Params: { group_id: string };
    Body: UpdateGroupRequest;
  }>,
  reply: FastifyReply
) {
  try {
    const { data: group, error } = await request.supabaseClient
      .from('groups')
      .update({
        name: request.body.name,
        type: request.body.type,
        shared_calendar_id: request.body.shared_calendar_id,
      })
      .eq('id', request.params.group_id)
      .select()
      .single();

    if (error) {
      request.log.error(error, 'Failed to update group');
      return reply.status(400).send({
        success: false,
        error: 'Failed to update group',
        message: error.message,
      });
    }

    return reply.send({
      success: true,
      group,
    });
  } catch (err) {
    request.log.error(err, 'Error in updateGroup');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Delete a group
 */
export async function deleteGroup(
  request: FastifyRequest<{ Params: { group_id: string } }>,
  reply: FastifyReply
) {
  try {
    const { error } = await request.supabaseClient
      .from('groups')
      .delete()
      .eq('id', request.params.group_id);

    if (error) {
      request.log.error(error, 'Failed to delete group');
      return reply.status(400).send({
        success: false,
        error: 'Failed to delete group',
        message: error.message,
      });
    }

    return reply.send({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (err) {
    request.log.error(err, 'Error in deleteGroup');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Leave a group
 */
export async function leaveGroup(
  request: FastifyRequest<{ Params: { group_id: string } }>,
  reply: FastifyReply
) {
  try {
    if (!request.membership) {
      return reply.status(403).send({
        success: false,
        error: 'Not a member of this group',
      });
    }

    // Check if user is the only owner
    if (request.membership.role_name === 'owner') {
      const { data: owners, error } = await request.supabaseClient
        .from('memberships')
        .select('id')
        .eq('group_id', request.params.group_id)
        .eq('role_name', 'owner')
        .is('left_at', null);

      if (error) {
        throw error;
      }

      if (owners && owners.length === 1) {
        return reply.status(400).send({
          success: false,
          error: 'Cannot leave group',
          message:
            'You are the only owner. Transfer ownership or delete the group first.',
        });
      }
    }

    // Mark membership as left
    const { error: leaveError } = await request.supabaseClient
      .from('memberships')
      .update({ left_at: new Date().toISOString() })
      .eq('id', request.membership.id);

    if (leaveError) {
      request.log.error(leaveError, 'Failed to leave group');
      return reply.status(400).send({
        success: false,
        error: 'Failed to leave group',
        message: leaveError.message,
      });
    }

    return reply.send({
      success: true,
      message: 'Successfully left the group',
    });
  } catch (err) {
    request.log.error(err, 'Error in leaveGroup');
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
