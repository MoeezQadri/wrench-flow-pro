import React from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/utils/permissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface PermissionGuardProps {
  resource: string;
  action: 'view' | 'create' | 'edit' | 'delete' | 'manage';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAlert?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  resource,
  action,
  children,
  fallback,
  showAlert = false,
}) => {
  const { currentUser } = useAuthContext();

  const userHasPermission = hasPermission(currentUser, resource, action);

  if (!userHasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showAlert) {
      return (
        <Alert className="border-destructive/50 text-destructive">
          <ShieldX className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to {action} {resource}.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
};

// Hook for checking permissions in components
export const usePermissions = () => {
  const { currentUser } = useAuthContext();

  return {
    hasPermission: (resource: string, action: 'view' | 'create' | 'edit' | 'delete' | 'manage') =>
      hasPermission(currentUser, resource, action),
    currentUser,
  };
};