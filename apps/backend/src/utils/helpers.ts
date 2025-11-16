import { randomBytes } from 'node:crypto';

import bcrypt from 'bcrypt';

import { DEFAULT_PERMISSIONS } from '../types/database';

import type { Membership, Permission } from '../types/database';

/**
 * Hash a PIN code for secure storage
 */
export async function hashPin(pin: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(pin, saltRounds);
}

/**
 * Verify a PIN against its hash
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

/**
 * Generate a random code for hub sessions
 */
export function generateHubCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
  let code = '';
  const bytes = randomBytes(length);

  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }

  return code;
}

/**
 * Generate a random invitation code
 */
export function generateInvitationCode(length = 8): string {
  return generateHubCode(length); // Use same logic as hub codes
}

/**
 * Validate pseudo format (3-20 alphanumeric + underscore, no spaces)
 */
export function isValidPseudo(pseudo: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(pseudo);
}

/**
 * Get permissions for a membership
 */
export function getMembershipPermissions(membership: Membership): Permission {
  const basePermissions =
    DEFAULT_PERMISSIONS[membership.role_name] || DEFAULT_PERMISSIONS.guest;

  // Merge with custom permissions
  const permissions = { ...basePermissions };

  if (membership.custom_permissions) {
    Object.keys(membership.custom_permissions).forEach((key) => {
      if (key in permissions) {
        permissions[key as keyof Permission] =
          membership.custom_permissions[key];
      }
    });
  }

  return permissions;
}

/**
 * Check if a membership has a specific permission
 */
export function hasPermission(
  membership: Membership,
  permission: keyof Permission
): boolean {
  const permissions = getMembershipPermissions(membership);
  return permissions[permission] === true;
}

/**
 * Check if a role name is valid
 */
export function isValidRole(role: string): boolean {
  return ['owner', 'admin', 'member', 'child', 'guest'].includes(role);
}

/**
 * Validate importance level
 */
export function validateImportance(importance: number): boolean {
  return Number.isInteger(importance) && importance >= 0 && importance <= 100;
}

/**
 * Get default importance for a role
 */
export function getDefaultImportance(role: string): number {
  const importanceMap: Record<string, number> = {
    owner: 100,
    admin: 80,
    member: 50,
    child: 30,
    guest: 10,
  };

  return importanceMap[role] || 50;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate PIN format (4-6 digits)
 */
export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

/**
 * Calculate completion rate
 */
export function calculateCompletionRate(
  completed: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

/**
 * Check if a date is in the past
 */
export function isPast(date: string | Date): boolean {
  return new Date(date) < new Date();
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: string | Date): boolean {
  return new Date(date) > new Date();
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Get user's IP address from request
 */
export function getClientIP(
  headers: Record<string, string | string[] | undefined>
): string | undefined {
  const forwarded = headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }

  const real = headers['x-real-ip'];
  if (real) {
    return Array.isArray(real) ? real[0] : real;
  }

  return undefined;
}
