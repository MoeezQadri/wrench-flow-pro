
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface RolePermissions {
  [key: string]: boolean;
  view: boolean;
  manage: boolean;
}

interface RoleResource {
  name: string;
  permissions: RolePermissions;
}

interface Role {
  id: string;
  name: string;
  description: string;
  resources: Record<string, RoleResource>;
}

interface SuperAdminRolesProps {
  // Props can be defined here
}

const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Owner',
    description: 'Full access to all resources',
    resources: {
      users: {
        name: 'Users',
        permissions: { view: true, manage: true }
      },
      billing: {
        name: 'Billing',
        permissions: { view: true, manage: true }
      },
      settings: {
        name: 'Settings',
        permissions: { view: true, manage: true }
      }
    }
  },
  {
    id: '2',
    name: 'Manager',
    description: 'Limited access to billing and settings',
    resources: {
      users: {
        name: 'Users',
        permissions: { view: true, manage: false }
      },
      billing: {
        name: 'Billing',
        permissions: { view: true, manage: false }
      },
      settings: {
        name: 'Settings',
        permissions: { view: true, manage: false }
      }
    }
  }
];

const resources = [
  { id: 'users', name: 'Users' },
  { id: 'billing', name: 'Billing' },
  { id: 'settings', name: 'Settings' },
  { id: 'reports', name: 'Reports' },
  { id: 'api', name: 'API Access' },
];

export const SuperAdminRoles = () => {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    // Initialize a new role with default permissions
    const newRoleResources: Record<string, RoleResource> = {};
    
    // Create default permissions for all resources
    resources.forEach(resource => {
      newRoleResources[resource.id] = {
        name: resource.name,
        permissions: { view: false, manage: false }
      };
    });

    const newRole: Role = {
      id: Date.now().toString(),
      name: newRoleName,
      description: newRoleDescription,
      resources: newRoleResources
    };

    setRoles([...roles, newRole]);
    setNewRoleName('');
    setNewRoleDescription('');
    toast.success('Role created successfully');
  };

  const handleEditRole = (role: Role) => {
    setEditingRole({ ...role });
  };

  const handleSaveRole = () => {
    if (!editingRole) return;

    const updatedRoles = roles.map(role => 
      role.id === editingRole.id ? editingRole : role
    );
    
    setRoles(updatedRoles);
    setEditingRole(null);
    toast.success('Role updated successfully');
  };

  const handleDeleteRole = (roleId: string) => {
    setRoles(roles.filter(role => role.id !== roleId));
    toast.success('Role deleted successfully');
  };

  const handleTogglePermission = (resourceId: string, permissionKey: 'view' | 'manage') => {
    if (!editingRole) return;
    
    const updatedResources = { ...editingRole.resources };
    const updatedResource = { 
      ...updatedResources[resourceId],
      permissions: { 
        ...updatedResources[resourceId].permissions,
        [permissionKey]: !updatedResources[resourceId].permissions[permissionKey]
      }
    };
    
    updatedResources[resourceId] = updatedResource;
    
    setEditingRole({
      ...editingRole,
      resources: updatedResources
    });
  };

  return (
    <div className="space-y-6">
      {editingRole ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Role: {editingRole.name}</CardTitle>
            <CardDescription>{editingRole.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="roleName" className="text-sm font-medium">Role Name</label>
              <Input
                id="roleName"
                value={editingRole.name}
                onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="roleDescription" className="text-sm font-medium">Description</label>
              <Input
                id="roleDescription"
                value={editingRole.description}
                onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
              />
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-4">Resource Permissions</h3>
              <div className="border rounded-lg divide-y">
                <div className="grid grid-cols-3 p-3 bg-muted font-medium text-sm">
                  <div>Resource</div>
                  <div>View</div>
                  <div>Manage</div>
                </div>
                {resources.map((resource) => (
                  <div key={resource.id} className="grid grid-cols-3 p-3 items-center">
                    <div>{resource.name}</div>
                    <div>
                      <Checkbox 
                        checked={editingRole.resources[resource.id]?.permissions.view || false}
                        onCheckedChange={() => handleTogglePermission(resource.id, 'view')}
                      />
                    </div>
                    <div>
                      <Checkbox 
                        checked={editingRole.resources[resource.id]?.permissions.manage || false}
                        onCheckedChange={() => handleTogglePermission(resource.id, 'manage')}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setEditingRole(null)}>Cancel</Button>
            <Button onClick={handleSaveRole}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Custom Roles</CardTitle>
              <CardDescription>Create and manage custom roles for your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="newRoleName" className="text-sm font-medium">Role Name</label>
                  <Input
                    id="newRoleName"
                    placeholder="e.g. Support Agent"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="newRoleDescription" className="text-sm font-medium">Description</label>
                  <Input
                    id="newRoleDescription"
                    placeholder="e.g. Limited access to customer data"
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleCreateRole}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Create New Role
              </Button>
            </CardFooter>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{role.name}</CardTitle>
                      <CardDescription>{role.description}</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditRole(role)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteRole(role.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg divide-y">
                    <div className="grid grid-cols-3 p-3 bg-muted font-medium text-sm">
                      <div>Resource</div>
                      <div>View</div>
                      <div>Manage</div>
                    </div>
                    {Object.entries(role.resources).map(([resourceId, resource]) => (
                      <div key={resourceId} className="grid grid-cols-3 p-3 items-center">
                        <div>{resource.name}</div>
                        <div>{resource.permissions.view ? '✓' : '—'}</div>
                        <div>{resource.permissions.manage ? '✓' : '—'}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SuperAdminRoles;
