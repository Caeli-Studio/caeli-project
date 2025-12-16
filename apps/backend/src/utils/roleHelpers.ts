import { DEFAULT_PERMISSIONS } from '../types/database';

import type { GroupRole } from '../types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates the 5 default roles for a group
 */
export async function createDefaultRoles(
  supabaseClient: SupabaseClient,
  groupId: string
): Promise<void> {
  const defaultRoles = [
    {
      group_id: groupId,
      name: 'owner',
      display_name: 'Maître de foyer',
      description: 'Propriétaire avec tous les droits',
      is_default: true,
      importance: 100,
      permissions: DEFAULT_PERMISSIONS.owner,
    },
    {
      group_id: groupId,
      name: 'admin',
      display_name: 'Administrateur',
      description: 'Administrateur avec droits étendus',
      is_default: true,
      importance: 80,
      permissions: DEFAULT_PERMISSIONS.admin,
    },
    {
      group_id: groupId,
      name: 'member',
      display_name: 'Membre',
      description: 'Membre standard',
      is_default: true,
      importance: 50,
      permissions: DEFAULT_PERMISSIONS.member,
    },
    {
      group_id: groupId,
      name: 'child',
      display_name: 'Enfant',
      description: 'Enfant avec permissions limitées',
      is_default: true,
      importance: 30,
      permissions: DEFAULT_PERMISSIONS.child,
    },
    {
      group_id: groupId,
      name: 'guest',
      display_name: 'Invité',
      description: 'Accès minimal',
      is_default: true,
      importance: 10,
      permissions: DEFAULT_PERMISSIONS.guest,
    },
  ];

  const { error } = await supabaseClient
    .from('group_roles')
    .insert(defaultRoles);

  if (error) {
    throw new Error(`Failed to create default roles: ${error.message}`);
  }
}

/**
 * Gets a role by its name in a group
 */
export async function getRoleByName(
  supabaseClient: SupabaseClient,
  groupId: string,
  roleName: string
): Promise<GroupRole | null> {
  const { data, error } = await supabaseClient
    .from('group_roles')
    .select('*')
    .eq('group_id', groupId)
    .eq('name', roleName)
    .single();

  if (error || !data) return null;
  return data as GroupRole;
}

/**
 * Gets the role with the lowest importance in a group
 * If multiple roles have the same lowest importance, returns a random one
 */
export async function getLowestImportanceRole(
  supabaseClient: SupabaseClient,
  groupId: string
): Promise<GroupRole | null> {
  const { data: roles, error } = await supabaseClient
    .from('group_roles')
    .select('*')
    .eq('group_id', groupId)
    .order('importance', { ascending: true });

  if (error || !roles || roles.length === 0) return null;

  // Find the minimum importance
  const minImportance = roles[0].importance;

  // Get all roles with the minimum importance
  const lowestRoles = roles.filter((r) => r.importance === minImportance);

  // Return a random one if multiple
  const randomIndex = Math.floor(Math.random() * lowestRoles.length);
  return lowestRoles[randomIndex] as GroupRole;
}

/**
 * Validates that a role_id exists in a group
 */
export async function isValidRoleId(
  supabaseClient: SupabaseClient,
  groupId: string,
  roleId: string
): Promise<boolean> {
  const { data, error } = await supabaseClient
    .from('group_roles')
    .select('id')
    .eq('group_id', groupId)
    .eq('id', roleId)
    .single();

  return !!data && !error;
}
