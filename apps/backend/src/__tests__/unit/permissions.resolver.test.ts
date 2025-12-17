import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  resolveMembershipPermissions,
  hasPermissionAsync,
} from '../../utils/helpers';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Permission resolver', () => {
  it('resolves permissions from role_name when no role_id', async () => {
    const membership: any = {
      role_name: 'member',
      custom_permissions: null,
    };

    const perms = await resolveMembershipPermissions(membership);

    expect(perms.can_create_tasks).toBe(true);
    expect(perms.can_assign_tasks).toBe(true);
    expect(perms.can_delete_tasks).toBe(false);
  });

  it('applies custom_permissions overrides', async () => {
    const membership: any = {
      role_name: 'member',
      custom_permissions: { can_delete_tasks: true },
    };

    const perms = await resolveMembershipPermissions(membership);
    expect(perms.can_delete_tasks).toBe(true);
  });

  it('fetches permissions from group_roles when role_id present', async () => {
    const membership: any = {
      role_name: 'member',
      role_id: 'role-123',
      custom_permissions: null,
    };

    // mock returned data
    (mockSupabase.single as any).mockResolvedValue({
      data: { permissions: { can_delete_tasks: true, can_create_tasks: true } },
      error: null,
    });

    const perms = await resolveMembershipPermissions(
      membership,
      mockSupabase as any
    );

    expect(mockSupabase.from).toHaveBeenCalledWith('group_roles');
    expect(perms.can_delete_tasks).toBe(true);
  });

  it('hasPermissionAsync accepts alias names', async () => {
    const membership: any = {
      role_name: 'member',
      custom_permissions: null,
    };

    const ok = await hasPermissionAsync(membership, 'create_tasks');
    expect(ok).toBe(true);
  });
});
