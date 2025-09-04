import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/utils/permissions';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PagePermissionGuardProps {
  resource: string;
  action: 'view' | 'create' | 'edit' | 'delete' | 'manage';
  children: React.ReactNode;
  redirectTo?: string;
  showAccessDenied?: boolean;
}

export const PagePermissionGuard: React.FC<PagePermissionGuardProps> = ({
  resource,
  action,
  children,
  redirectTo = '/',
  showAccessDenied = true,
}) => {
  const { currentUser } = useAuthContext();

  const userHasPermission = hasPermission(currentUser, resource, action);

  if (!userHasPermission) {
    if (!showAccessDenied) {
      return <Navigate to={redirectTo} replace />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <ShieldX className="h-8 w-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Access Denied</h3>
                <p className="text-sm text-muted-foreground">
                  You don't have permission to {action} {resource}. 
                  Please contact your administrator if you believe this is an error.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};