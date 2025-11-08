export interface UserRole {
  id: string;
  name: 'super_admin' | 'hr_admin' | 'hr_manager' | 'hr_analyst' | 'employee';
  permissions: Permission[];
}

export interface Permission {
  resource: 'employees' | 'analytics' | 'chat' | 'data_upload' | 'settings' | 'audit';
  actions: ('read' | 'write' | 'delete' | 'export')[];
}

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  roles: UserRole[];
  employeeId?: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export type AuthResult = {
  success: true;
  user: AuthUser;
} | {
  success: false;
  error: string;
  statusCode: 401 | 403;
}

// Default role configurations
export const DEFAULT_ROLES: Record<string, UserRole> = {
  super_admin: {
    id: 'role_super_admin',
    name: 'super_admin',
    permissions: [
      { resource: 'employees', actions: ['read', 'write', 'delete', 'export'] },
      { resource: 'analytics', actions: ['read', 'export'] },
      { resource: 'chat', actions: ['read', 'write'] },
      { resource: 'data_upload', actions: ['read', 'write', 'delete'] },
      { resource: 'settings', actions: ['read', 'write'] },
      { resource: 'audit', actions: ['read', 'export'] },
    ],
  },
  hr_admin: {
    id: 'role_hr_admin',
    name: 'hr_admin',
    permissions: [
      { resource: 'employees', actions: ['read', 'write', 'export'] },
      { resource: 'analytics', actions: ['read', 'export'] },
      { resource: 'chat', actions: ['read', 'write'] },
      { resource: 'data_upload', actions: ['read', 'write'] },
      { resource: 'settings', actions: ['read'] },
      { resource: 'audit', actions: ['read'] },
    ],
  },
  hr_manager: {
    id: 'role_hr_manager',
    name: 'hr_manager',
    permissions: [
      { resource: 'employees', actions: ['read', 'write', 'export'] },
      { resource: 'analytics', actions: ['read'] },
      { resource: 'chat', actions: ['read', 'write'] },
      { resource: 'data_upload', actions: ['read'] },
    ],
  },
  hr_analyst: {
    id: 'role_hr_analyst',
    name: 'hr_analyst',
    permissions: [
      { resource: 'employees', actions: ['read', 'export'] },
      { resource: 'analytics', actions: ['read', 'export'] },
      { resource: 'chat', actions: ['read', 'write'] },
    ],
  },
  employee: {
    id: 'role_employee',
    name: 'employee',
    permissions: [
      { resource: 'chat', actions: ['read', 'write'] },
    ],
  },
};
