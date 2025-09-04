import React from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { hasPermission, getUserDisplayRole } from '@/utils/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Check, X } from 'lucide-react';

const PermissionTest = () => {
  const { currentUser } = useAuthContext();

  const resources = [
    'dashboard', 'invoices', 'customers', 'vehicles', 'tasks', 
    'mechanics', 'attendance', 'parts', 'expenses', 'reports',
    'users', 'settings', 'subscription'
  ];

  const actions = ['view', 'create', 'edit', 'delete', 'manage'] as const;

  const PermissionIcon = ({ hasAccess }: { hasAccess: boolean }) => (
    hasAccess ? (
      <Check className="h-4 w-4 text-green-600" />
    ) : (
      <X className="h-4 w-4 text-red-600" />
    )
  );

  if (!currentUser) {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Permission Testing Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Current User</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-medium">{currentUser.name}</span>
                <Badge variant="secondary">
                  {getUserDisplayRole(currentUser.role || 'member')}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Permission Matrix</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      {actions.map(action => (
                        <TableHead key={action} className="text-center capitalize">
                          {action}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resources.map(resource => (
                      <TableRow key={resource}>
                        <TableCell className="font-medium capitalize">
                          {resource}
                        </TableCell>
                        {actions.map(action => (
                          <TableCell key={action} className="text-center">
                            <PermissionIcon 
                              hasAccess={hasPermission(currentUser, resource, action)} 
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Navigation Access</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { name: 'Dashboard', resource: 'dashboard' },
                  { name: 'Invoices', resource: 'invoices' },
                  { name: 'Customers', resource: 'customers' },
                  { name: 'Vehicles', resource: 'vehicles' },
                  { name: 'Tasks', resource: 'tasks' },
                  { name: 'Mechanics', resource: 'mechanics' },
                  { name: 'Attendance', resource: 'attendance' },
                  { name: 'Parts', resource: 'parts' },
                  { name: 'Expenses', resource: 'expenses' },
                  { name: 'Reports', resource: 'reports' },
                  { name: 'Settings', resource: 'settings' },
                ].map(item => (
                  <Card key={item.name}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.name}</span>
                        <PermissionIcon 
                          hasAccess={hasPermission(currentUser, item.resource, 'view')} 
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionTest;