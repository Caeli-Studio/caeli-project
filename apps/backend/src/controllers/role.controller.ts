import type {
  CreateGroupRoleRequest,
  UpdateGroupRoleRequest,
} from '../types/database';
import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * GET /api/groups/:group_id/roles
 * List all roles in a group
 */
export async function getRoles(
  request: FastifyRequest<{ Params: { group_id: string } }>,
  reply: FastifyReply
) {
  const { group_id } = request.params;

  const { data: roles, error } = await request.supabaseClient
    .from('group_roles')
    .select(
      `
      *,
      memberships!memberships_role_id_fkey(count)
    `
    )
    .eq('group_id', group_id)
    .order('importance', { ascending: false });

  if (error) {
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch roles',
    });
  }

  // Transform to add member_count properly
  const rolesWithCount =
    roles?.map((role) => ({
      ...role,
      member_count: role.memberships?.[0]?.count || 0,
      memberships: undefined,
    })) || [];

  return reply.send({
    success: true,
    data: rolesWithCount,
  });
}

/**
 * GET /api/groups/:group_id/roles/:role_id
 * Get a specific role
 */
export async function getRole(
  request: FastifyRequest<{
    Params: { group_id: string; role_id: string };
  }>,
  reply: FastifyReply
) {
  const { group_id, role_id } = request.params;

  const { data: roleData, error } = await request.supabaseClient
    .from('group_roles')
    .select(
      `
      *,
      memberships!memberships_role_id_fkey(count)
    `
    )
    .eq('id', role_id)
    .eq('group_id', group_id)
    .single();

  // Transform to add member_count properly
  const role = roleData
    ? {
        ...roleData,
        member_count: roleData.memberships?.[0]?.count || 0,
        memberships: undefined,
      }
    : null;

  if (error || !role) {
    return reply.status(404).send({
      success: false,
      error: 'Role not found',
    });
  }

  return reply.send({
    success: true,
    data: role,
  });
}

/**
 * POST /api/groups/:group_id/roles
 * Create a new custom role
 */
export async function createRole(
  request: FastifyRequest<{
    Params: { group_id: string };
    Body: CreateGroupRoleRequest;
  }>,
  reply: FastifyReply
) {
  const { group_id } = request.params;
  const { name, display_name, description, importance, permissions } =
    request.body;

  // Validation: name and display_name required
  if (!name || !display_name) {
    return reply.status(400).send({
      success: false,
      error: 'name and display_name are required',
    });
  }

  // Validation: cannot create role with system role name
  const systemRoles = ['owner', 'admin', 'member', 'child', 'guest'];
  if (systemRoles.includes(name.toLowerCase())) {
    return reply.status(400).send({
      success: false,
      error: 'Cannot create role with system role name',
    });
  }

  const { data: role, error } = await request.supabaseClient
    .from('group_roles')
    .insert({
      group_id,
      name: name.toLowerCase(),
      display_name,
      description,
      importance: importance || 50,
      permissions: permissions || {},
      is_default: false,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Duplicate key
      return reply.status(409).send({
        success: false,
        error: 'A role with this name already exists in this group',
      });
    }

    return reply.status(500).send({
      success: false,
      error: 'Failed to create role',
    });
  }

  return reply.status(201).send({
    success: true,
    data: role,
  });
}

/**
 * PUT /api/groups/:group_id/roles/:role_id
 * Update a custom role
 */
export async function updateRole(
  request: FastifyRequest<{
    Params: { group_id: string; role_id: string };
    Body: UpdateGroupRoleRequest;
  }>,
  reply: FastifyReply
) {
  const { group_id, role_id } = request.params;
  const { display_name, description, importance, permissions } = request.body;

  // Check that role exists and is not a system role
  const { data: existingRole, error: fetchError } = await request.supabaseClient
    .from('group_roles')
    .select('*')
    .eq('id', role_id)
    .eq('group_id', group_id)
    .single();

  if (fetchError || !existingRole) {
    return reply.status(404).send({
      success: false,
      error: 'Role not found',
    });
  }

  // Only owner role cannot be modified
  if (existingRole.name === 'owner') {
    return reply.status(403).send({
      success: false,
      error: 'Cannot modify owner role',
    });
  }

  const updateData: Record<string, unknown> = {};
  if (display_name !== undefined) updateData.display_name = display_name;
  if (description !== undefined) updateData.description = description;
  if (importance !== undefined) updateData.importance = importance;
  if (permissions !== undefined) updateData.permissions = permissions;

  const { data: role, error } = await request.supabaseClient
    .from('group_roles')
    .update(updateData)
    .eq('id', role_id)
    .eq('group_id', group_id)
    .select()
    .single();

  if (error) {
    return reply.status(500).send({
      success: false,
      error: 'Failed to update role',
    });
  }

  return reply.send({
    success: true,
    data: role,
  });
}

/**
 * DELETE /api/groups/:group_id/roles/:role_id
 * Delete a custom role
 */
export async function deleteRole(
  request: FastifyRequest<{
    Params: { group_id: string; role_id: string };
  }>,
  reply: FastifyReply
) {
  const { group_id, role_id } = request.params;

  // Check that role exists and is not a system role
  const { data: existingRole, error: fetchError } = await request.supabaseClient
    .from('group_roles')
    .select('*, memberships(count)')
    .eq('id', role_id)
    .eq('group_id', group_id)
    .single();

  if (fetchError || !existingRole) {
    return reply.status(404).send({
      success: false,
      error: 'Role not found',
    });
  }

  // Only owner role cannot be deleted
  if (existingRole.name === 'owner') {
    return reply.status(403).send({
      success: false,
      error: 'Cannot delete owner role',
    });
  }

  // Check that no member has this role
  const memberCount = existingRole.memberships?.[0]?.count || 0;
  if (memberCount > 0) {
    return reply.status(409).send({
      success: false,
      error: 'Cannot delete role with assigned members',
      member_count: memberCount,
    });
  }

  const { error } = await request.supabaseClient
    .from('group_roles')
    .delete()
    .eq('id', role_id)
    .eq('group_id', group_id);

  if (error) {
    return reply.status(500).send({
      success: false,
      error: 'Failed to delete role',
    });
  }

  return reply.status(204).send();
}
