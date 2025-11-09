'use client'

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

import { ReactNode } from 'react';
import { SimpleAuthUser, SimpleRole, RoleName } from '@/lib/auth/roles-v2';

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
 * Hook to get current user from context
 * TODO: Replace with actual auth context when implemented
 */
function useAuth(): SimpleAuthUser | null {
  // For now, return dev user in development
  if (process.env.NODE_ENV === 'development') {
    return {
      userId: 'dev-user',
      email: 'dev@hrskills.local',
      name: 'Developer',
      role: {
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
      sessionId: 'dev-session',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    };
  }

  // TODO: Get from AuthContext
  return null;
}

/**
 * Render children only if user is admin
 */
export function RequireAdmin({ children, fallback = null }: RoleGuardProps) {
  const user = useAuth();

  if (!user || user.role.name !== 'admin') {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Render children only if user has specific permission
 */
export function RequirePermission({
  children,
  permission,
  fallback = null,
}: PermissionGuardProps) {
  const user = useAuth();

  if (!user || !user.role.permissions[permission]) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Render children only for specific role
 */
export function ShowForRole({ children, role, fallback = null }: RoleSpecificGuardProps) {
  const user = useAuth();

  if (!user || user.role.name !== role) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hide children for specific role
 */
export function HideForRole({ children, role }: RoleSpecificGuardProps) {
  const user = useAuth();

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
  const currentUser = useAuth();

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
  const user = useAuth();
  const hasPermission = user && user.role.permissions[permission];

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
