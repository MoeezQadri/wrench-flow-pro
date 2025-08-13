import { User } from '@/types';

export interface PermissionConfig {
  resource: string;
  action: 'view' | 'create' | 'edit' | 'delete' | 'manage';
  allowedRoles: string[];
}

// Define role hierarchy and permissions
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'owner': ['view', 'create', 'edit', 'delete', 'manage'], // Full permissions
  'admin': ['view', 'create', 'edit', 'delete', 'manage'], // Same as owner for operational purposes
  'manager': ['view', 'create', 'edit', 'delete'], // Can't manage users/settings
  'foreman': ['view', 'create', 'edit'], // Can't delete
  'mechanic': ['view', 'create'], // Limited permissions
  'member': ['view'], // Read-only
};

// Resource-specific permissions
export const RESOURCE_PERMISSIONS: Record<string, PermissionConfig[]> = {
  mechanics: [
    { resource: 'mechanics', action: 'view', allowedRoles: ['owner', 'admin', 'manager', 'foreman', 'mechanic'] },
    { resource: 'mechanics', action: 'create', allowedRoles: ['owner', 'admin', 'manager', 'foreman'] },
    { resource: 'mechanics', action: 'edit', allowedRoles: ['owner', 'admin', 'manager', 'foreman'] },
    { resource: 'mechanics', action: 'delete', allowedRoles: ['owner', 'admin', 'manager'] },
    { resource: 'mechanics', action: 'manage', allowedRoles: ['owner', 'admin', 'manager'] },
  ],
  customers: [
    { resource: 'customers', action: 'view', allowedRoles: ['owner', 'admin', 'manager', 'foreman', 'mechanic'] },
    { resource: 'customers', action: 'create', allowedRoles: ['owner', 'admin', 'manager', 'foreman'] },
    { resource: 'customers', action: 'edit', allowedRoles: ['owner', 'admin', 'manager', 'foreman'] },
    { resource: 'customers', action: 'delete', allowedRoles: ['owner', 'admin', 'manager'] },
    { resource: 'customers', action: 'manage', allowedRoles: ['owner', 'admin', 'manager'] },
  ],
  tasks: [
    { resource: 'tasks', action: 'view', allowedRoles: ['owner', 'admin', 'manager', 'foreman', 'mechanic'] },
    { resource: 'tasks', action: 'create', allowedRoles: ['owner', 'admin', 'manager', 'foreman', 'mechanic'] },
    { resource: 'tasks', action: 'edit', allowedRoles: ['owner', 'admin', 'manager', 'foreman', 'mechanic'] },
    { resource: 'tasks', action: 'delete', allowedRoles: ['owner', 'admin', 'manager'] },
    { resource: 'tasks', action: 'manage', allowedRoles: ['owner', 'admin', 'manager'] },
  ],
  users: [
    { resource: 'users', action: 'view', allowedRoles: ['owner', 'admin', 'manager'] },
    { resource: 'users', action: 'create', allowedRoles: ['owner', 'admin'] },
    { resource: 'users', action: 'edit', allowedRoles: ['owner', 'admin'] },
    { resource: 'users', action: 'delete', allowedRoles: ['owner', 'admin'] },
    { resource: 'users', action: 'manage', allowedRoles: ['owner', 'admin'] },
  ],
  settings: [
    { resource: 'settings', action: 'view', allowedRoles: ['owner', 'admin', 'manager'] },
    { resource: 'settings', action: 'edit', allowedRoles: ['owner', 'admin'] },
    { resource: 'settings', action: 'manage', allowedRoles: ['owner', 'admin'] },
  ],
  subscription: [
    { resource: 'subscription', action: 'view', allowedRoles: ['owner', 'admin'] },
    { resource: 'subscription', action: 'manage', allowedRoles: ['owner', 'admin'] },
  ],
  parts: [
    { resource: 'parts', action: 'view', allowedRoles: ['owner', 'admin', 'manager', 'foreman', 'mechanic'] },
    { resource: 'parts', action: 'create', allowedRoles: ['owner', 'admin', 'manager', 'foreman'] },
    { resource: 'parts', action: 'edit', allowedRoles: ['owner', 'admin', 'manager', 'foreman'] },
    { resource: 'parts', action: 'delete', allowedRoles: ['owner', 'admin', 'manager'] },
    { resource: 'parts', action: 'manage', allowedRoles: ['owner', 'admin', 'manager'] },
  ],
  vehicles: [
    { resource: 'vehicles', action: 'view', allowedRoles: ['owner', 'admin', 'manager', 'foreman', 'mechanic'] },
    { resource: 'vehicles', action: 'create', allowedRoles: ['owner', 'admin', 'manager', 'foreman'] },
    { resource: 'vehicles', action: 'edit', allowedRoles: ['owner', 'admin', 'manager', 'foreman'] },
    { resource: 'vehicles', action: 'delete', allowedRoles: ['owner', 'admin', 'manager'] },
    { resource: 'vehicles', action: 'manage', allowedRoles: ['owner', 'admin', 'manager'] },
  ],
  expenses: [
    { resource: 'expenses', action: 'view', allowedRoles: ['owner', 'admin', 'manager', 'foreman'] },
    { resource: 'expenses', action: 'create', allowedRoles: ['owner', 'admin', 'manager', 'foreman'] },
    { resource: 'expenses', action: 'edit', allowedRoles: ['owner', 'admin', 'manager', 'foreman'] },
    { resource: 'expenses', action: 'delete', allowedRoles: ['owner', 'admin', 'manager'] },
    { resource: 'expenses', action: 'manage', allowedRoles: ['owner', 'admin', 'manager'] },
  ],
  invoices: [
    { resource: 'invoices', action: 'view', allowedRoles: ['owner', 'admin', 'manager', 'foreman', 'mechanic'] },
    { resource: 'invoices', action: 'create', allowedRoles: ['owner', 'admin', 'manager', 'foreman'] },
    { resource: 'invoices', action: 'edit', allowedRoles: ['owner', 'admin', 'manager', 'foreman'] },
    { resource: 'invoices', action: 'delete', allowedRoles: ['owner', 'admin', 'manager'] },
    { resource: 'invoices', action: 'manage', allowedRoles: ['owner', 'admin', 'manager'] },
  ],
  attendance: [
    { resource: 'attendance', action: 'view', allowedRoles: ['owner', 'admin', 'manager', 'foreman', 'mechanic'] },
    { resource: 'attendance', action: 'create', allowedRoles: ['owner', 'admin', 'manager', 'foreman', 'mechanic'] },
    { resource: 'attendance', action: 'edit', allowedRoles: ['owner', 'admin', 'manager', 'foreman'] },
    { resource: 'attendance', action: 'delete', allowedRoles: ['owner', 'admin', 'manager'] },
    { resource: 'attendance', action: 'manage', allowedRoles: ['owner', 'admin', 'manager'] },
  ],
};

/**
 * Check if a user has permission for a specific resource and action
 */
export const hasPermission = (
  user: User | null, 
  resource: string, 
  action: 'view' | 'create' | 'edit' | 'delete' | 'manage'
): boolean => {
  if (!user || !user.role) {
    return false;
  }

  // Super admins have all permissions
  if (user.role === 'superuser' || user.role === 'superadmin') {
    return true;
  }

  // Check resource-specific permissions
  const resourcePerms = RESOURCE_PERMISSIONS[resource];
  if (resourcePerms) {
    const permission = resourcePerms.find(p => p.action === action);
    if (permission) {
      return permission.allowedRoles.includes(user.role);
    }
  }

  // Fallback to role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role];
  if (rolePermissions) {
    return rolePermissions.includes(action);
  }

  return false;
};

/**
 * Check if a user can manage mechanics
 */
export const canManageMechanics = (user: User | null): boolean => {
  return hasPermission(user, 'mechanics', 'manage') || 
         (user?.role === 'foreman'); // Special case for foremen
};

/**
 * Check if a user can manage customers
 */
export const canManageCustomers = (user: User | null): boolean => {
  return hasPermission(user, 'customers', 'manage');
};

/**
 * Check if a user can manage tasks
 */
export const canManageTasks = (user: User | null): boolean => {
  return hasPermission(user, 'tasks', 'manage') || 
         (user?.role === 'foreman'); // Special case for foremen
};

/**
 * Check if a user can manage users
 */
export const canManageUsers = (user: User | null): boolean => {
  return hasPermission(user, 'users', 'manage');
};

/**
 * Check if a user can manage organization settings
 */
export const canManageSettings = (user: User | null): boolean => {
  return hasPermission(user, 'settings', 'manage');
};

/**
 * Check if a user can manage subscription
 */
export const canManageSubscription = (user: User | null): boolean => {
  return hasPermission(user, 'subscription', 'manage');
};

/**
 * Get user display role (converts owner to Admin for UI)
 */
export const getUserDisplayRole = (role: string): string => {
  if (role === 'owner') {
    return 'Admin';
  }
  return role.charAt(0).toUpperCase() + role.slice(1);
};

/**
 * Check if user has admin-level permissions (owner or admin)
 */
export const isAdminUser = (user: User | null): boolean => {
  return user?.role === 'owner' || user?.role === 'admin';
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = (user: User | null): boolean => {
  return user?.role === 'superuser' || user?.role === 'superadmin';
};