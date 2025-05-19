import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Check, CircleSlash, Plus, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import { rolePermissions, UserRole, RolePermissionMap } from '@/types';

// Define types for our component state
interface RoleResource {
  name: string;
  permissions: {
    view: boolean;
    manage: boolean;
    [key: string]: boolean;
  };
}

interface Role {
  id: string;
  name: string;
  description: string;
  resources: Record<string, RoleResource>;
  isDefault: boolean;
  isSystem: boolean;
  userCount: number;
}

// Convert rolePermissions from the types file to our component structure
const convertRolePermissions = (): Record<string, Role> => {
  const roles: Record<string, Role> = {};
  
  // Loop through the role permissions from types.ts
  Object.entries(rolePermissions).forEach(([roleName, permissions]) => {
    const resources: Record<string, RoleResource> = {};
    
    // Convert each permission to our component format
    Object.entries(permissions).forEach(([resourceName, permission]) => {
      if (typeof permission === 'boolean') {
        // Handle simple boolean permissions
        resources[resourceName] = {
          name: resourceName,
          permissions: {
            view: permission,
            manage: permission
          }
        };
      } else {
        // Handle complex permission objects
        const resourcePermissions: Record<string, boolean> = {};
        
        Object.entries(permission).forEach(([action, value]) => {
          // Convert 'own' string value to boolean (true) for simplicity
          resourcePermissions[action] = typeof value === 'boolean' ? value : true;
        });
        
        resources[resourceName] = {
          name: resourceName,
          permissions: resourcePermissions
        };
      }
    });
    
    // Create the role object
    roles[roleName] = {
      id: roleName,
      name: roleName.charAt(0).toUpperCase() + roleName.slice(1),
      description: `${roleName.charAt(0).toUpperCase() + roleName.slice(1)} role permissions`,
      resources,
      isDefault: roleName === 'owner',
      isSystem: true,
      userCount: roleName === 'owner' ? 5 : roleName === 'manager' ? 3 : 1
    };
  });
  
  return roles;
};

const SuperAdminRoles: React.FC = () => {
  const [roles, setRoles] = useState<Record<string, Role>>(convertRolePermissions());
  const [selectedRoleId, setSelectedRoleId] = useState<string>('owner');
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  
  const selectedRole = roles[selectedRoleId];
  
  const handleSavePermissions = () => {
    toast.success('Permissions updated successfully');
  };
  
  const handleCreateRole = () => {
    if (!newRoleName) {
      toast.error('Role name is required');
      return;
    }
    
    const roleId = newRoleName.toLowerCase().replace(/\s+/g, '_');
    
    if (roles[roleId]) {
      toast.error('A role with this name already exists');
      return;
    }
    
    // Create a new role based on the owner role but with all permissions set to false
    const newRole: Role = {
      id: roleId,
      name: newRoleName,
      description: newRoleDescription || `Custom ${newRoleName} role`,
      resources: Object.fromEntries(
        Object.entries(roles.owner.resources).map(([resourceName, resource]) => [
          resourceName,
          {
            name: resource.name,
            permissions: Object.fromEntries(
              Object.keys(resource.permissions).map(permission => [permission, false])
            )
          }
        ])
      ),
      isDefault: false,
      isSystem: false,
      userCount: 0
    };
    
    setRoles({
      ...roles,
      [roleId]: newRole
    });
    
    setSelectedRoleId(roleId);
    setIsCreatingRole(false);
    setNewRoleName('');
    setNewRoleDescription('');
    
    toast.success('New role created successfully');
  };
  
  const handleUpdatePermission = (resourceName: string, permissionName: string, value: boolean) => {
    if (selectedRole.isSystem) {
      toast.error('Cannot modify system roles');
      return;
    }
    
    setRoles(prevRoles => ({
      ...prevRoles,
      [selectedRoleId]: {
        ...prevRoles[selectedRoleId],
        resources: {
          ...prevRoles[selectedRoleId].resources,
          [resourceName]: {
            ...prevRoles[selectedRoleId].resources[resourceName],
            permissions: {
              ...prevRoles[selectedRoleId].resources[resourceName].permissions,
              [permissionName]: value
            }
          }
        }
      }
    }));
  };
  
  const renderPermissionCheckbox = (resourceName: string, permissionName: string, isChecked: boolean) => {
    return (
      <Checkbox
        checked={isChecked}
        disabled={selectedRole.isSystem}
        onCheckedChange={(checked) => {
          handleUpdatePermission(resourceName, permissionName, checked === true);
        }}
      />
    );
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="assignments">User Assignments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="roles">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Roles</CardTitle>
                  <CardDescription>Manage system roles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-2">
                    {Object.values(roles).map((role) => (
                      <Button
                        key={role.id}
                        variant={selectedRoleId === role.id ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setSelectedRoleId(role.id)}
                      >
                        <div className="flex items-center w-full">
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          <span className="flex-1">{role.name}</span>
                          {role.isDefault && (
                            <span className="bg-primary/10 text-primary text-xs py-0.5 px-2 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                  
                  {!isCreatingRole ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => setIsCreatingRole(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Role
                    </Button>
                  ) : (
                    <div className="space-y-3 mt-4">
                      <div className="space-y-1">
                        <Label htmlFor="role-name">Role Name</Label>
                        <Input
                          id="role-name"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          placeholder="Enter role name"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="role-description">Description</Label>
                        <Input
                          id="role-description"
                          value={newRoleDescription}
                          onChange={(e) => setNewRoleDescription(e.target.value)}
                          placeholder="Optional description"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setIsCreatingRole(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={handleCreateRole}
                        >
                          Create
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {selectedRole && (
              <div className="md:col-span-3">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedRole.name} Permissions</CardTitle>
                        <CardDescription>{selectedRole.description}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedRole.isSystem ? (
                          <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded flex items-center gap-1">
                            <CircleSlash className="h-3 w-3" /> System role (read-only)
                          </div>
                        ) : (
                          <Button onClick={handleSavePermissions}>
                            Save Changes
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{selectedRole.userCount} users with this role</span>
                      </div>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Resource</TableHead>
                          <TableHead>View</TableHead>
                          <TableHead>Manage</TableHead>
                          {/* Other common permissions could go here */}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.values(selectedRole.resources)
                          .filter(resource => typeof resource === 'object')
                          .map((resource) => (
                            <TableRow key={resource.name}>
                              <TableCell className="font-medium capitalize">
                                {resource.name}
                              </TableCell>
                              <TableCell>
                                {resource.permissions.view !== undefined
                                  ? renderPermissionCheckbox(resource.name, 'view', resource.permissions.view)
                                  : <span className="text-muted-foreground">—</span>
                                }
                              </TableCell>
                              <TableCell>
                                {resource.permissions.manage !== undefined
                                  ? renderPermissionCheckbox(resource.name, 'manage', resource.permissions.manage)
                                  : <span className="text-muted-foreground">—</span>
                                }
                              </TableCell>
                              {/* Other permissions cells could go here */}
                            </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="border-t pt-6 flex justify-between">
                    <div className="text-sm text-muted-foreground">
                      {selectedRole.isSystem 
                        ? "System roles cannot be modified to ensure system stability." 
                        : "Changes will apply to all users with this role."}
                    </div>
                    {!selectedRole.isSystem && !selectedRole.isDefault && (
                      <Button variant="destructive" size="sm">
                        Delete Role
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Role Assignments</CardTitle>
              <CardDescription>Manage which users have which roles</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Role assignment feature coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminRoles;
