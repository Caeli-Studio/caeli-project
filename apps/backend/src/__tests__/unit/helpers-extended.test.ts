import { describe, it, expect } from 'vitest';

import {
  isValidEmail,
  isValidRole,
  validateImportance,
  generateHubCode,
  generateInvitationCode,
  getClientIP,
  getMembershipPermissions,
  hasPermission,
} from '../../utils/helpers';

describe('Helper Functions - Extended Tests', () => {
  describe('isValidEmail', () => {
    it('should validate valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('noatsign.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidRole', () => {
    it('should accept valid roles', () => {
      expect(isValidRole('owner')).toBe(true);
      expect(isValidRole('admin')).toBe(true);
      expect(isValidRole('member')).toBe(true);
      expect(isValidRole('child')).toBe(true);
      expect(isValidRole('guest')).toBe(true);
    });

    it('should reject invalid roles', () => {
      expect(isValidRole('superadmin')).toBe(false);
      expect(isValidRole('moderator')).toBe(false);
      expect(isValidRole('')).toBe(false);
    });
  });

  describe('validateImportance', () => {
    it('should accept valid importance levels', () => {
      expect(validateImportance(0)).toBe(true);
      expect(validateImportance(50)).toBe(true);
      expect(validateImportance(100)).toBe(true);
    });

    it('should reject invalid importance levels', () => {
      expect(validateImportance(101)).toBe(false);
      expect(validateImportance(-1)).toBe(false);
      expect(validateImportance(150)).toBe(false);
    });
  });

  describe('generateHubCode', () => {
    it('should generate code of default length', () => {
      const code = generateHubCode();
      expect(code).toHaveLength(8);
      expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
    });

    it('should generate code of custom length', () => {
      const code = generateHubCode(12);
      expect(code).toHaveLength(12);
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateHubCode());
      }
      expect(codes.size).toBeGreaterThan(90); // Should be mostly unique
    });
  });

  describe('generateInvitationCode', () => {
    it('should generate code of default length', () => {
      const code = generateInvitationCode();
      expect(code).toHaveLength(8);
    });

    it('should generate code of custom length', () => {
      const code = generateInvitationCode(16);
      expect(code).toHaveLength(16);
    });
  });

  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const headers = { 'x-forwarded-for': '192.168.1.100, 10.0.0.1' };
      expect(getClientIP(headers)).toBe('192.168.1.100');
    });

    it('should extract IP from x-real-ip header', () => {
      const headers = { 'x-real-ip': '127.0.0.1' };
      expect(getClientIP(headers)).toBe('127.0.0.1');
    });

    it('should return undefined when no headers', () => {
      const headers = {};
      expect(getClientIP(headers)).toBeUndefined();
    });

    it('should handle array values in x-forwarded-for', () => {
      const headers = { 'x-forwarded-for': ['192.168.1.50'] };
      expect(getClientIP(headers)).toBe('192.168.1.50');
    });
  });

  describe('getMembershipPermissions', () => {
    it('should return owner permissions', () => {
      const membership = {
        role_name: 'owner',
        custom_permissions: null,
      } as any;

      const perms = getMembershipPermissions(membership);
      expect(perms.can_manage_members).toBe(true);
      expect(perms.can_edit_group).toBe(true);
      expect(perms.can_delete_tasks).toBe(true);
    });

    it('should return member permissions', () => {
      const membership = {
        role_name: 'member',
        custom_permissions: null,
      } as any;

      const perms = getMembershipPermissions(membership);
      expect(perms.can_create_tasks).toBe(true);
      expect(perms.can_manage_members).toBe(false);
      expect(perms.can_delete_tasks).toBe(false);
    });

    it('should return child permissions', () => {
      const membership = {
        role_name: 'child',
        custom_permissions: null,
      } as any;

      const perms = getMembershipPermissions(membership);
      expect(perms.can_create_tasks).toBe(false);
      expect(perms.can_assign_tasks).toBe(false);
    });

    it('should merge custom permissions', () => {
      const membership = {
        role_name: 'child',
        custom_permissions: {
          can_create_tasks: true,
          can_assign_tasks: true,
        },
      } as any;

      const perms = getMembershipPermissions(membership);
      expect(perms.can_create_tasks).toBe(true);
      expect(perms.can_assign_tasks).toBe(true);
      expect(perms.can_manage_members).toBe(false); // Still false
    });
  });

  describe('hasPermission', () => {
    it('should return true for owner with any permission', () => {
      const membership = {
        role_name: 'owner',
        custom_permissions: null,
      } as any;

      expect(hasPermission(membership, 'can_manage_members')).toBe(true);
      expect(hasPermission(membership, 'can_delete_tasks')).toBe(true);
      expect(hasPermission(membership, 'can_edit_group')).toBe(true);
    });

    it('should return false for child without permission', () => {
      const membership = {
        role_name: 'child',
        custom_permissions: null,
      } as any;

      expect(hasPermission(membership, 'can_manage_members')).toBe(false);
      expect(hasPermission(membership, 'can_delete_tasks')).toBe(false);
    });

    it('should respect custom permissions overrides', () => {
      const membership = {
        role_name: 'member',
        custom_permissions: {
          can_delete_tasks: true,
        },
      } as any;

      expect(hasPermission(membership, 'can_delete_tasks')).toBe(true);
    });
  });
});
