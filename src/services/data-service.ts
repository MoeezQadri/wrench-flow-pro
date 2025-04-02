import { User, UserRole, RolePermissionMap as TypesRolePermissionMap } from '@/types';

// Ensure we're using the correct RolePermissionMap type
export type { TypesRolePermissionMap as RolePermissionMap };

export const getCurrentUser = (): User => {
  const userString = localStorage.getItem('currentUser');
  if (userString) {
    try {
      return JSON.parse(userString);
    } catch (error) {
      console.error("Error parsing currentUser from localStorage:", error);
      return {
        id: 'guest',
        name: 'Guest User',
        email: 'guest@example.com',
        role: 'mechanic', // Default role
        isActive: false,
      };
    }
  }

  return {
    id: 'guest',
    name: 'Guest User',
    email: 'guest@example.com',
    role: 'mechanic', // Default role
    isActive: false,
  };
};

export const hasPermission = (
  user: User | null,
  resource: keyof RolePermissionMap,
  action: string
): boolean => {
  if (!user) {
    return false;
  }

  const role = user.role;
  const rolePermissions = getRolePermissions(role);

  if (!rolePermissions || !rolePermissions[resource]) {
    return false;
  }

  const permission = rolePermissions[resource];

  if (typeof permission === 'boolean') {
    return permission;
  }

  if (typeof permission === 'object' && permission !== null && action in permission) {
    const actionPermission = (permission as any)[action];

    if (typeof actionPermission === 'boolean') {
      return actionPermission;
    }

    if (actionPermission === 'own') {
      // Example: Check if the user owns the resource
      // This will depend on your data structure and how you determine ownership
      // For example, if tasks have a mechanicId, you can check if user.mechanicId === task.mechanicId
      return true; // Replace with your ownership check logic
    }
  }

  return false;
};

export const getRolePermissions = (role: UserRole): RolePermissionMap | undefined => {
  const rolePermissions = {
    superuser: {
      dashboard: true,
      customers: { view: true, manage: true },
      invoices: { view: true, manage: true },
      mechanics: { view: true, manage: true },
      tasks: { view: true, manage: true },
      parts: { view: true, manage: true },
      finance: { view: true, manage: true },
      expenses: { view: true, manage: true },
      reports: { view: true, manage: true },
      attendance: { view: true, manage: true, approve: true },
      settings: { view: true, manage: true },
      organization: { view: true, manage: true },
      users: { view: true, manage: true },
      subscription: { view: true, manage: true },
      vehicles: { view: true, manage: true },
      roles: { view: true, manage: true }
    },
    owner: {
      dashboard: true,
      customers: { view: true, manage: true },
      invoices: { view: true, manage: true },
      mechanics: { view: true, manage: true },
      tasks: { view: true, manage: true },
      parts: { view: true, manage: true },
      finance: { view: true, manage: true },
      expenses: { view: true, manage: true },
      reports: { view: true, manage: true },
      attendance: { view: true, manage: true, approve: true },
      settings: { view: true, manage: true },
      organization: { view: true, manage: true },
      users: { view: true, manage: true },
      subscription: { view: true, manage: true },
      vehicles: { view: true, manage: true },
      roles: { view: true, manage: true } // Added roles permission for owner
    },
    manager: {
      dashboard: true,
      customers: { view: true, manage: true },
      invoices: { view: true, manage: true },
      mechanics: { view: true, manage: true },
      tasks: { view: true, manage: true },
      parts: { view: true, manage: true },
      finance: { view: true, manage: true },
      expenses: { view: true, manage: true },
      reports: { view: true, manage: true },
      attendance: { view: true, manage: true, approve: true },
      settings: { view: false, manage: false },
      organization: { view: true, manage: false },
      users: { view: true, manage: false },
      subscription: { view: true, manage: false },
      vehicles: { view: true, manage: true },
      roles: { view: true, manage: false } // Added roles permission for manager
    },
    foreman: {
      dashboard: true,
      customers: { view: true, manage: false },
      invoices: { view: true, manage: false },
      mechanics: { view: true, manage: false },
      tasks: { view: true, manage: true, assign: true, create: true, update: true },
      parts: { view: true, manage: false },
      finance: { view: false, manage: false },
      expenses: { view: false, manage: false },
      reports: { view: true, manage: false },
      attendance: { view: true, manage: true, approve: true, create: true, update: true },
      settings: { view: false, manage: false },
      organization: { view: false, manage: false },
      users: { view: false, manage: false },
      subscription: { view: false, manage: false },
      vehicles: { view: true, manage: false },
      roles: { view: false, manage: false } // Added roles permission for foreman
    },
    mechanic: {
      dashboard: false,
      customers: { view: true, manage: false },
      invoices: { view: false, manage: false },
      mechanics: { view: false, manage: false },
      tasks: { view: true, manage: 'own' },
      parts: { view: true, manage: false },
      finance: { view: false, manage: false },
      expenses: { view: false, manage: false },
      reports: { view: 'own', manage: false },
      attendance: { view: 'own', manage: 'own', approve: false },
      settings: { view: false, manage: false },
      organization: { view: false, manage: false },
      users: { view: false, manage: false },
      subscription: { view: false, manage: false },
      vehicles: { view: true, manage: false },
      roles: { view: false, manage: false } // Added roles permission for mechanic
    }
  };

  return rolePermissions[role];
};
