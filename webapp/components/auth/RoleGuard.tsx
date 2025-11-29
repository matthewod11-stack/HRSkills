'use client';

/**
 * Role-Based UI Guard Components
 *
 * Provides declarative components for conditional rendering based on user role/permissions.
 * Uses the simplified v2 RBAC system.
 *
 * Usage:
 *   <RequireAdmin>Admin-only content</RequireAdmin>
 *   <RequirePermission permission="editEmployees">Edit button</RequirePermission>
 *   <ShowForRole role="user">User-only content</ShowForRole>
 */

import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import type { RoleName, SimpleRole } from '@/lib/auth/roles-v2';

interface RoleGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface PermissionGuardProps extends RoleGuardProps {
  permission: keyof SimpleRole['permissions'];
}

interface RoleSpecificGuardProps extends RoleGuardProps {
  role: RoleName;
}

/**
 * Render children only if user is admin
 */
export function RequireAdmin({ children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user || user.role.name !== 'admin') {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Render children only if user has specific permission
 */
export function RequirePermission({ children, permission, fallback = null }: PermissionGuardProps) {
  const { user } = useAuth();

  if (!user || !user.role.permissions[permission]) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Render children only for specific role
 */
export function ShowForRole({ children, role, fallback = null }: RoleSpecificGuardProps) {
  const { user } = useAuth();

  if (!user || user.role.name !== role) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hide children for specific role
 */
export function HideForRole({ children, role }: RoleSpecificGuardProps) {
  const { user } = useAuth();

  if (user && user.role.name === role) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Render different content based on role
 */
export function RoleSwitch({
  admin,
  user,
  fallback = null,
}: {
  admin?: ReactNode;
  user?: ReactNode;
  fallback?: ReactNode;
}) {
  const { user: currentUser } = useAuth();

  if (!currentUser) {
    return <>{fallback}</>;
  }

  if (currentUser.role.name === 'admin' && admin) {
    return <>{admin}</>;
  }

  if (currentUser.role.name === 'user' && user) {
    return <>{user}</>;
  }

  return <>{fallback}</>;
}

/**
 * Button wrapper that disables based on permissions
 */
export function PermissionButton({
  permission,
  children,
  disabledMessage = 'You do not have permission for this action',
  ...props
}: PermissionGuardProps & {
  disabledMessage?: string;
  onClick?: () => void;
  className?: string;
}) {
  const { user } = useAuth();
  const hasPermission = user?.role.permissions[permission];

  return (
    <button
      {...props}
      disabled={!hasPermission}
      title={!hasPermission ? disabledMessage : undefined}
    >
      {children}
    </button>
  );
}
