
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash, Save, Plus, X, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { rolePermissions, RolePermissionMap, UserRole } from '@/types';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: RolePermissionMap;
  isSystem: boolean;
  createdAt: string;
}

// Mock custom roles
const mockRoles: Role[] = [
  {
    id: 'role_1',
    name: 'Customer Service',
    description: 'Handle customer queries and manage customer data',
    permissions: {
      dashboard: true,
      customers: { view: true, manage: true },
      invoices: { view: true, manage: false },
      mechanics: { view: false, manage: false },
      tasks: { view: true, manage: false, assign: false },
      parts: { view: false, manage: false },
      expenses: { view: false, manage: false },
      vehicles: { view: true, manage: true },
      reports: { view: false, manage: false },
      users: { view: false, manage: false },
      settings: { view: false, manage: false },
      attendance: { view: false, manage: false, approve: false },
      subscription: { view: false, manage: false },
      finance: { view: false, manage: false },
      organization: { view: false, manage: false },
      roles: { view: false, manage: false }
    },
    isSystem: false,
    createdAt: '2023-05-01T00:00:00Z'
  },
  {
    id: 'role_2',
    name: 'Accountant',
    description: 'Manage finances, invoices, expenses',
    permissions: {
      dashboard: true,
      customers: { view: true, manage: false },
      invoices: { view: true, manage: true },
      mechanics: { view: false, manage: false },
      tasks: { view: false, manage: false },
      parts: { view: true, manage: false },
      expenses: { view: true, manage: true },
      vehicles: { view: false, manage: false },
      reports: { view: true, manage: false },
      users: { view: false, manage: false },
      settings: { view: false, manage: false },
      attendance: { view: false, manage: false },
      subscription: { view: false, manage: false },
      finance: { view: true, manage: true },
      organization: { view: false, manage: false },
      roles: { view: false, manage: false }
    },
    isSystem: false,
    createdAt: '2023-06-15T00:00:00Z'
  }
];

// System roles (from the rolePermissions)
const getSystemRoles = (): Role[] => {
  return Object.entries(rolePermissions).map(([roleName, permissions]) => ({
    id: `system_${roleName}`,
    name: roleName.charAt(0).toUpperCase() + roleName.slice(1),
    description: `System ${roleName} role`,
    permissions,
    isSystem: true,
    createdAt: '2023-01-01T00:00:00Z'
  }));
};

const SuperAdminRoles = () => {
  const [roles, setRoles] = useState<Role[]>([...getSystemRoles(), ...mockRoles]);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState<Partial<Role>>({
    name: '',
    description: '',
    permissions: { ...rolePermissions.mechanic }, // Start with mechanic permissions as template
  });
  const [newRoleDialogOpen, setNewRoleDialogOpen] = useState(false);
  
  const handleDeleteRole = (roleId: string) => {
    // Check if it's a system role
    if (roleId.startsWith('system_')) {
      toast.error("System roles cannot be deleted");
      return;
    }
    
    setRoles(roles.filter(role => role.id !== roleId));
    toast.success("Role deleted successfully");
  };
  
  const handleSaveNewRole = () => {
    if (!newRole.name) {
      toast.error("Role name is required");
      return;
    }
    
    const role: Role = {
      id: `role_${Date.now()}`,
      name: newRole.name,
      description: newRole.description || '',
      permissions: newRole.permissions as RolePermissionMap,
      isSystem: false,
      createdAt: new Date().toISOString()
    };
    
    setRoles([...roles, role]);
    setNewRole({
      name: '',
      description: '',
      permissions: { ...rolePermissions.mechanic },
    });
    setNewRoleDialogOpen(false);
    toast.success("New role created successfully");
  };
  
  const handleUpdateRole = () => {
    if (!editingRole || !editingRole.name) {
      toast.error("Role name is required");
      return;
    }
    
    // Check if it's a system role
    if (editingRole.isSystem) {
      toast.error("System roles cannot be modified");
      setEditingRole(null);
      return;
    }
    
    setRoles(roles.map(role => role.id === editingRole.id ? editingRole : role));
    setEditingRole(null);
    toast.success("Role updated successfully");
  };
  
  const togglePermission = (
    role: Role | Partial<Role>, 
    resource: string, 
    action: string, 
    value?: boolean | 'own'
  ) => {
    const permissions = { ...role.permissions };
    
    // Handle simple boolean permissions
    if (resource === 'dashboard') {
      permissions.dashboard = value !== undefined ? value : !permissions.dashboard;
      return permissions;
    }
    
    // Handle complex permissions
    const resourcePermissions = { ...permissions[resource] };
    
    if (action in resourcePermissions) {
      const currentValue = (resourcePermissions as any)[action];
      let newValue: boolean | 'own';
      
      if (value !== undefined) {
        newValue = value;
      } else {
        // Cycle through boolean -> 'own' -> false
        if (currentValue === true) {
          newValue = 'own';
        } else if (currentValue === 'own') {
          newValue = false;
        } else {
          newValue = true;
        }
      }
      
      (resourcePermissions as any)[action] = newValue;
    }
    
    permissions[resource] = resourcePermissions;
    return permissions;
  };
  
  const renderPermissionValue = (value: boolean | 'own' | undefined) => {
    if (value === true) return <Check className="h-4 w-4 text-green-600" />;
    if (value === 'own') return <Badge variant="outline">Own</Badge>;
    return <X className="h-4 w-4 text-red-600" />;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Role Management</h3>
        <Button onClick={() => setNewRoleDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Role
        </Button>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Roles</TabsTrigger>
          <TabsTrigger value="system">System Roles</TabsTrigger>
          <TabsTrigger value="custom">Custom Roles</TabsTrigger>
          {editingRole && <TabsTrigger value="edit">Editing: {editingRole.name}</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Roles</CardTitle>
              <CardDescription>
                System and custom roles defined in the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.description}</TableCell>
                      <TableCell>
                        <Badge variant={role.isSystem ? "default" : "outline"}>
                          {role.isSystem ? "System" : "Custom"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(role.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingRole({...role})}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {!role.isSystem && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRole(role.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Roles</CardTitle>
              <CardDescription>
                Built-in roles that cannot be modified
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.filter(role => role.isSystem).map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.description}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRole({...role})}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Custom Roles</CardTitle>
              <CardDescription>
                User-defined roles that can be modified
              </CardDescription>
            </CardHeader>
            <CardContent>
              {roles.filter(role => !role.isSystem).length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No custom roles defined yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setNewRoleDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first custom role
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.filter(role => !role.isSystem).map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>{new Date(role.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingRole({...role})}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRole(role.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={() => setNewRoleDialogOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Role
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {editingRole && (
          <TabsContent value="edit">
            <Card>
              <CardHeader>
                <CardTitle>Edit Role: {editingRole.name}</CardTitle>
                <CardDescription>
                  {editingRole.isSystem 
                    ? "You can view but not modify system roles" 
                    : "Modify role details and permissions"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-role-name">Role Name</Label>
                    <Input
                      id="edit-role-name"
                      value={editingRole.name}
                      onChange={(e) => setEditingRole({...editingRole, name: e.target.value})}
                      disabled={editingRole.isSystem}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-role-description">Description</Label>
                    <Input
                      id="edit-role-description"
                      value={editingRole.description}
                      onChange={(e) => setEditingRole({...editingRole, description: e.target.value})}
                      disabled={editingRole.isSystem}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label>Permissions</Label>
                  
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Resource</TableHead>
                          <TableHead>View</TableHead>
                          <TableHead>Manage</TableHead>
                          <TableHead>Other Permissions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Dashboard</TableCell>
                          <TableCell>
                            <Checkbox 
                              checked={!!editingRole.permissions.dashboard} 
                              onCheckedChange={(checked) => {
                                if (!editingRole.isSystem) {
                                  setEditingRole({
                                    ...editingRole, 
                                    permissions: {
                                      ...editingRole.permissions,
                                      dashboard: !!checked
                                    }
                                  });
                                }
                              }}
                              disabled={editingRole.isSystem}
                            />
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        
                        {['customers', 'invoices', 'mechanics', 'parts', 'vehicles', 'reports', 
                          'users', 'settings', 'finance', 'organization', 'subscription', 'roles'].map(resource => (
                          <TableRow key={resource}>
                            <TableCell className="font-medium capitalize">{resource}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                disabled={editingRole.isSystem}
                                onClick={() => {
                                  if (!editingRole.isSystem) {
                                    const updatedPermissions = togglePermission(
                                      editingRole, resource, 'view'
                                    );
                                    setEditingRole({
                                      ...editingRole,
                                      permissions: updatedPermissions
                                    });
                                  }
                                }}
                              >
                                {renderPermissionValue(((editingRole.permissions[resource] || {}) as any).view)}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                disabled={editingRole.isSystem}
                                onClick={() => {
                                  if (!editingRole.isSystem) {
                                    const updatedPermissions = togglePermission(
                                      editingRole, resource, 'manage'
                                    );
                                    setEditingRole({
                                      ...editingRole,
                                      permissions: updatedPermissions
                                    });
                                  }
                                }}
                              >
                                {renderPermissionValue(((editingRole.permissions[resource] || {}) as any).manage)}
                              </Button>
                            </TableCell>
                            <TableCell>
                              {/* Special permissions for tasks */}
                              {resource === 'tasks' && (
                                <div className="flex space-x-2">
                                  <Label className="whitespace-nowrap">Assign:</Label>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    disabled={editingRole.isSystem}
                                    onClick={() => {
                                      if (!editingRole.isSystem) {
                                        const updatedPermissions = togglePermission(
                                          editingRole, 'tasks', 'assign'
                                        );
                                        setEditingRole({
                                          ...editingRole,
                                          permissions: updatedPermissions
                                        });
                                      }
                                    }}
                                  >
                                    {renderPermissionValue((editingRole.permissions.tasks as any).assign)}
                                  </Button>
                                </div>
                              )}
                              
                              {/* Special permissions for attendance */}
                              {resource === 'attendance' && (
                                <div className="flex space-x-2">
                                  <Label className="whitespace-nowrap">Approve:</Label>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    disabled={editingRole.isSystem}
                                    onClick={() => {
                                      if (!editingRole.isSystem) {
                                        const updatedPermissions = togglePermission(
                                          editingRole, 'attendance', 'approve'
                                        );
                                        setEditingRole({
                                          ...editingRole,
                                          permissions: updatedPermissions
                                        });
                                      }
                                    }}
                                  >
                                    {renderPermissionValue((editingRole.permissions.attendance as any).approve)}
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="outline" onClick={() => setEditingRole(null)}>
                  Cancel
                </Button>
                
                {!editingRole.isSystem && (
                  <Button onClick={handleUpdateRole}>
                    <Save className="h-4 w-4 mr-2" />
                    Update Role
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
      
      <Dialog open={newRoleDialogOpen} onOpenChange={setNewRoleDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a new custom role with specific permissions
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-role-name">Role Name</Label>
                <Input
                  id="new-role-name"
                  value={newRole.name}
                  onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                  placeholder="e.g., Customer Support"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-role-description">Description</Label>
                <Input
                  id="new-role-description"
                  value={newRole.description}
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                  placeholder="Brief description of role responsibilities"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Clone Permissions From</Label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(rolePermissions).map((roleName) => (
                  <Button
                    key={roleName}
                    variant="outline"
                    size="sm"
                    onClick={() => setNewRole({
                      ...newRole,
                      permissions: { ...rolePermissions[roleName as UserRole] }
                    })}
                  >
                    {roleName.charAt(0).toUpperCase() + roleName.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNewRole}>
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminRoles;
