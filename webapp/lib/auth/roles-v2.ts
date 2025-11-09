/**
 * Simplified RBAC System (Version 2)
 *
 * Reduces complexity from 5 roles to 2 roles:
 * - Admin: Full access to all features
 * - User: Chat access with limited actions
 *
 * This is a 90% reduction in RBAC code while maintaining essential security.
 */

export type RoleName = 'admin' | 'user';

export interface SimpleRole {
  id: string;
  name: RoleName;
  description: string;
  permissions: {
    chat: boolean;
    viewEmployees: boolean;
    editEmployees: boolean;
    viewAnalytics: boolean;
    exportData: boolean;
    uploadData: boolean;
    manageSettings: boolean;
    takeActions: boolean; // Send emails, create docs, etc.
  };
}

/**
 * Simplified role definitions
 */
export const ROLES: Record<RoleName, SimpleRole> = {
  admin: {
    id: 'role_admin',
    name: 'admin',
    description: 'Full access to all features',
    permissions: {
      chat: true,
      viewEmployees: true,
      editEmployees: true,
      viewAnalytics: true,
      exportData: true,
      uploadData: true,
      manageSettings: true,
      takeActions: true,
    },
  },
  user: {
    id: 'role_user',
    name: 'user',
    description: 'Chat access with limited actions',
    permissions: {
      chat: true,
      viewEmployees: true,
      editEmployees: false,
      viewAnalytics: true,
      exportData: false,
      uploadData: false,
      manageSettings: false,
      takeActions: false, // Can't send emails, create docs
    },
  },
};

/**
 * Map old role names to new role names for migration
 */
export const ROLE_MIGRATION_MAP: Record<string, RoleName> = {
  super_admin: 'admin',
  hr_admin: 'admin',
  hr_manager: 'admin',
  hr_analyst: 'user',
  employee: 'user',
};

/**
 * Check if user has a specific permission
 */
export function can(role: SimpleRole, permission: keyof SimpleRole['permissions']): boolean {
  return role.permissions[permission] === true;
}

/**
 * Check if user is admin
 */
export function isAdmin(role: SimpleRole): boolean {
  return role.name === 'admin';
}

/**
 * Check if user is regular user
 */
export function isUser(role: SimpleRole): boolean {
  return role.name === 'user';
}

/**
 * Get role by name
 */
export function getRoleByName(roleName: string): SimpleRole {
  // Check if it's already a v2 role name
  if (roleName === 'admin' || roleName === 'user') {
    return ROLES[roleName];
  }

  // Migrate from v1 role name
  const mappedRoleName = ROLE_MIGRATION_MAP[roleName] || 'user';
  return ROLES[mappedRoleName];
}

/**
 * User interface with simplified role
 */
export interface SimpleAuthUser {
  userId: string;
  email: string;
  name: string;
  role: SimpleRole;
  employeeId?: string;
  sessionId: string;
  iat: number;
  exp: number;
}

/**
 * Auth result type
 */
export type SimpleAuthResult =
  | {
      success: true;
      user: SimpleAuthUser;
    }
  | {
      success: false;
      error: string;
      statusCode: 401 | 403;
    };

/**
 * Permission check helper
 */
export function hasPermission(
  user: SimpleAuthUser,
  permission: keyof SimpleRole['permissions']
): boolean {
  return can(user.role, permission);
}

/**
 * Role check helper
 */
export function hasRole(user: SimpleAuthUser, roleName: RoleName): boolean {
  return user.role.name === roleName;
}

/**
 * Require admin role
 */
export function requireAdmin(user: SimpleAuthUser): boolean {
  return isAdmin(user.role);
}
