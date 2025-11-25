import { describe, it, expect } from 'vitest';

import {
  hashPin,
  verifyPin,
  generateHubCode,
  generateInvitationCode,
  isValidPseudo,
  isValidRole,
  validateImportance,
  getDefaultImportance,
  isValidEmail,
  getMembershipPermissions,
  hasPermission,
} from '../../utils/helpers';

describe('Helpers - Utility Functions', () => {
  describe('PIN hashing', () => {
    it('should hash a PIN', async () => {
      const pin = '1234';
      const hash = await hashPin(pin);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(pin);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify correct PIN', async () => {
      const pin = '1234';
      const hash = await hashPin(pin);
      const isValid = await verifyPin(pin, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect PIN', async () => {
      const pin = '1234';
      const hash = await hashPin(pin);
      const isValid = await verifyPin('5678', hash);

      expect(isValid).toBe(false);
    });

    it('should create different hashes for same PIN', async () => {
      const pin = '1234';
      const hash1 = await hashPin(pin);
      const hash2 = await hashPin(pin);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Code generation', () => {
    it('should generate hub code with default length', () => {
      const code = generateHubCode();

      expect(code).toBeDefined();
      expect(code.length).toBe(8);
      expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
    });

    it('should generate hub code with custom length', () => {
      const code = generateHubCode(12);

      expect(code.length).toBe(12);
    });

    it('should generate unique codes', () => {
      const code1 = generateHubCode();
      const code2 = generateHubCode();

      expect(code1).not.toBe(code2);
    });

    it('should generate invitation code', () => {
      const code = generateInvitationCode();

      expect(code).toBeDefined();
      expect(code.length).toBe(8);
      expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
    });

    it('should generate invitation code with custom length', () => {
      const code = generateInvitationCode(10);

      expect(code.length).toBe(10);
    });
  });

  describe('Pseudo validation', () => {
    it('should accept valid pseudos', () => {
      expect(isValidPseudo('john_doe')).toBe(true);
      expect(isValidPseudo('user123')).toBe(true);
      expect(isValidPseudo('abc')).toBe(true);
      expect(isValidPseudo('a_1_b_2')).toBe(true);
      expect(isValidPseudo('12345678901234567890')).toBe(true); // 20 chars
    });

    it('should reject invalid pseudos', () => {
      expect(isValidPseudo('ab')).toBe(false); // Too short
      expect(isValidPseudo('123456789012345678901')).toBe(false); // Too long
      expect(isValidPseudo('user name')).toBe(false); // Space
      expect(isValidPseudo('user-name')).toBe(false); // Hyphen
      expect(isValidPseudo('user.name')).toBe(false); // Dot
      expect(isValidPseudo('user@name')).toBe(false); // Special char
      expect(isValidPseudo('')).toBe(false); // Empty
    });
  });

  describe('Role validation', () => {
    it('should accept valid roles', () => {
      expect(isValidRole('owner')).toBe(true);
      expect(isValidRole('admin')).toBe(true);
      expect(isValidRole('member')).toBe(true);
      expect(isValidRole('child')).toBe(true);
      expect(isValidRole('guest')).toBe(true);
    });

    it('should reject invalid roles', () => {
      expect(isValidRole('superadmin')).toBe(false);
      expect(isValidRole('user')).toBe(false);
      expect(isValidRole('moderator')).toBe(false);
      expect(isValidRole('')).toBe(false);
      expect(isValidRole('ADMIN')).toBe(false); // Case sensitive
    });
  });

  describe('Importance validation', () => {
    it('should accept valid importance levels', () => {
      expect(validateImportance(0)).toBe(true);
      expect(validateImportance(50)).toBe(true);
      expect(validateImportance(100)).toBe(true);
      expect(validateImportance(1)).toBe(true);
      expect(validateImportance(99)).toBe(true);
    });

    it('should reject invalid importance levels', () => {
      expect(validateImportance(-1)).toBe(false);
      expect(validateImportance(101)).toBe(false);
      expect(validateImportance(1.5)).toBe(false); // Not integer
      expect(validateImportance(NaN)).toBe(false);
      expect(validateImportance(Infinity)).toBe(false);
    });
  });

  describe('Default importance', () => {
    it('should return correct defaults for roles', () => {
      expect(getDefaultImportance('owner')).toBe(100);
      expect(getDefaultImportance('admin')).toBe(80);
      expect(getDefaultImportance('member')).toBe(50);
      expect(getDefaultImportance('child')).toBe(30);
      expect(getDefaultImportance('guest')).toBe(10);
    });

    it('should return default for unknown role', () => {
      expect(getDefaultImportance('unknown')).toBe(50);
    });
  });

  describe('Email validation', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('first+last@test.io')).toBe(true);
      expect(isValidEmail('123@test.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user name@test.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('Membership permissions', () => {
    it('should get permissions for owner role', () => {
      const membership = {
        id: 'test-id',
        user_id: 'user-1',
        group_id: 'group-1',
        role_name: 'owner',
        custom_permissions: null,
      } as any;

      const permissions = getMembershipPermissions(membership);

      expect(permissions.can_create_tasks).toBe(true);
      expect(permissions.can_assign_tasks).toBe(true);
      expect(permissions.can_delete_tasks).toBe(true);
      expect(permissions.can_manage_members).toBe(true);
    });

    it('should get permissions for member role', () => {
      const membership = {
        id: 'test-id',
        user_id: 'user-1',
        group_id: 'group-1',
        role_name: 'member',
        custom_permissions: null,
      } as any;

      const permissions = getMembershipPermissions(membership);

      expect(permissions.can_create_tasks).toBe(true);
      expect(permissions.can_manage_members).toBe(false);
    });

    it('should merge custom permissions', () => {
      const membership = {
        id: 'test-id',
        user_id: 'user-1',
        group_id: 'group-1',
        role_name: 'member',
        custom_permissions: {
          can_delete_tasks: true,
        },
      } as any;

      const permissions = getMembershipPermissions(membership);

      expect(permissions.can_delete_tasks).toBe(true);
    });

    it('should handle guest role', () => {
      const membership = {
        id: 'test-id',
        user_id: 'user-1',
        group_id: 'group-1',
        role_name: 'guest',
        custom_permissions: null,
      } as any;

      const permissions = getMembershipPermissions(membership);

      expect(permissions.can_create_tasks).toBe(false);
      expect(permissions.can_assign_tasks).toBe(false);
    });
  });

  describe('Permission checking', () => {
    it('should check if membership has permission', () => {
      const membership = {
        id: 'test-id',
        user_id: 'user-1',
        group_id: 'group-1',
        role_name: 'admin',
        custom_permissions: null,
      } as any;

      expect(hasPermission(membership, 'can_create_tasks')).toBe(true);
      expect(hasPermission(membership, 'can_manage_members')).toBe(true);
    });

    it('should return false for missing permission', () => {
      const membership = {
        id: 'test-id',
        user_id: 'user-1',
        group_id: 'group-1',
        role_name: 'child',
        custom_permissions: null,
      } as any;

      expect(hasPermission(membership, 'can_delete_tasks')).toBe(false);
      expect(hasPermission(membership, 'can_manage_members')).toBe(false);
    });

    it('should respect custom permissions in permission check', () => {
      const membership = {
        id: 'test-id',
        user_id: 'user-1',
        group_id: 'group-1',
        role_name: 'child',
        custom_permissions: {
          can_create_tasks: true,
        },
      } as any;

      expect(hasPermission(membership, 'can_create_tasks')).toBe(true);
    });
  });
});
