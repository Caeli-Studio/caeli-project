export interface Permission {
  can_create_tasks: boolean;
  can_assign_tasks: boolean;
  can_delete_tasks: boolean;
  can_manage_members: boolean;
  can_edit_group: boolean;
  can_manage_roles: boolean;
}

export interface GroupRole {
  id: string;
  group_id: string;
  name: string;
  display_name: string;
  description?: string;
  is_default: boolean;
  importance: number;
  permissions: Permission;
  created_at: string;
  updated_at: string;
}

export interface CreateRoleRequest {
  name: string;
  display_name: string;
  description?: string;
  importance?: number;
  permissions: Partial<Permission>;
}

export interface UpdateRoleRequest {
  display_name?: string;
  description?: string;
  importance?: number;
  permissions?: Partial<Permission>;
}

export interface GroupRoleWithStats extends GroupRole {
  member_count?: number | { count: number };
}

// Helper pour les labels des permissions
export const PERMISSION_LABELS: Record<keyof Permission, string> = {
  can_create_tasks: 'Créer des tâches',
  can_assign_tasks: 'Assigner des tâches',
  can_delete_tasks: 'Supprimer des tâches',
  can_manage_members: 'Gérer les membres',
  can_edit_group: 'Modifier le foyer',
  can_manage_roles: 'Gérer les rôles',
};

// Couleurs pour les rôles
export const ROLE_COLORS: Record<string, string> = {
  owner: '#FF6B6B',
  admin: '#4ECDC4',
  member: '#95E1D3',
  child: '#FFD93D',
  guest: '#A8E6CF',
  custom: '#A8DADC',
};

// Rôles système (non modifiables)
export const SYSTEM_ROLES = ['owner', 'admin', 'member', 'child', 'guest'];
