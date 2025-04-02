
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Save, ShieldAlert } from 'lucide-react';
import { UserRole } from '@/types';

// Available permissions in the system
const availablePermissions = [
  { id: 'customers.view', name: 'View Customers', description: 'Can view customer details' },
  { id: 'customers.edit', name: 'Edit Customers', description: 'Can add or edit customer information' },
  { id: 'customers.delete', name: 'Delete Customers', description: 'Can delete customers' },
  { id: 'invoices.view', name: 'View Invoices', description: 'Can view all invoices' },
  { id: 'invoices.create', name: 'Create Invoices', description: 'Can create new invoices' },
  { id: 'invoices.edit', name: 'Edit Invoices', description: 'Can edit existing invoices' },
  { id: 'invoices.delete', name: 'Delete Invoices', description: 'Can delete invoices' },
  { id: 'reports.view', name: 'View Reports', description: 'Can view business reports' },
  { id: 'settings.view', name: 'View Settings', description: 'Can view application settings' },
  { id: 'settings.edit', name: 'Edit Settings', description: 'Can edit application settings' },
  { id: 'users.view', name: 'View Users', description: 'Can view all users' },
  { id: 'users.manage', name: 'Manage Users', description: 'Can add, edit or deactivate users' },
  { id: 'roles.manage', name: 'Manage Roles', description: 'Can manage roles and permissions' },
];

// Permission categories for grouping
const permissionCategories = [
  { id: 'customers', name: 'Customers' },
  { id: 'invoices', name: 'Invoices' },
  { id: 'reports', name: 'Reports' },
  { id: 'settings', name: 'Settings' },
  { id: 'users', name: 'Users & Access' },
];

// Default roles with their permissions
const defaultRoles = [
  {
    id: 'owner',
    name: 'Owner',
    description: 'Full access to all features',
    permissions: availablePermissions.map(p => p.id),
    isDefault: true,
    isEditable: false
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Can manage most aspects of the business',
    permissions: availablePermissions
      .filter(p => !['roles.manage'].includes(p.id))
      .map(p => p.id),
    isDefault: true,
    isEditable: true
  },
  {
    id: 'foreman',
    name: 'Foreman',
    description: 'Can manage workshop operations',
    permissions: [
      'customers.view', 'customers.edit',
      'invoices.view', 'invoices.create', 'invoices.edit',
      'reports.view',
    ],
    isDefault: true,
    isEditable: true
  },
  {
    id: 'mechanic',
    name: 'Mechanic',
    description: 'Basic access to workshop tools',
    permissions: [
      'customers.view',
      'invoices.view', 'invoices.create',
    ],
    isDefault: true,
    isEditable: true
  },
];

// Role type
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
  isEditable: boolean;
}

const RolesManagementTab = () => {
  // State for roles
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Group permissions by category
  const groupedPermissions = permissionCategories.map(category => {
    return {
      ...category,
      permissions: availablePermissions.filter(p => p.id.startsWith(category.id + '.'))
    };
  });
  
  // Handle adding a new role
  const handleAddRole = () => {
    setSelectedRole({
      id: '',
      name: '',
      description: '',
      permissions: [],
      isDefault: false,
      isEditable: true
    });
    setIsDialogOpen(true);
  };
  
  // Handle editing an existing role
  const handleEditRole = (role: Role) => {
    setSelectedRole({ ...role });
    setIsDialogOpen(true);
  };
  
  // Handle saving a role
  const handleSaveRole = () => {
    if (!selectedRole) return;
    
    if (!selectedRole.name.trim()) {
      toast.error("Role name is required");
      return;
    }
    
    // For new roles, generate an ID
    if (!selectedRole.id) {
      selectedRole.id = selectedRole.name.toLowerCase().replace(/\s+/g, '-');
    }
    
    // Check if role with this ID already exists
    const existingRoleIndex = roles.findIndex(r => r.id === selectedRole.id);
    
    if (existingRoleIndex >= 0) {
      // Update existing role
      const updatedRoles = [...roles];
      updatedRoles[existingRoleIndex] = selectedRole;
      setRoles(updatedRoles);
      toast.success("Role updated successfully");
    } else {
      // Add new role
      setRoles([...roles, selectedRole]);
      toast.success("New role created successfully");
    }
    
    setIsDialogOpen(false);
    setSelectedRole(null);
  };
  
  // Handle deleting a role
  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isDefault) {
      toast.error("Default roles cannot be deleted");
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete the role "${role?.name}"?`)) {
      setRoles(roles.filter(r => r.id !== roleId));
      toast.success("Role deleted successfully");
    }
  };
  
  // Toggle a permission for the selected role
  const togglePermission = (permissionId: string) => {
    if (!selectedRole) return;
    
    setSelectedRole(prev => {
      if (!prev) return prev;
      
      const newPermissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId];
        
      return { ...prev, permissions: newPermissions };
    });
  };
  
  // Check if a permission is selected
  const isPermissionSelected = (permissionId: string) => {
    return selectedRole?.permissions.includes(permissionId) || false;
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
          <CardDescription>
            Manage user roles and their permissions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Roles define what users can do in the system. Each role has a set of permissions.
              </p>
            </div>
            <Button onClick={handleAddRole}>
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium capitalize">
                    {role.name}
                    {role.isDefault && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        Default
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>{role.permissions.length} permissions</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRole(role)}
                      disabled={!role.isEditable}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRole(role.id)}
                      disabled={role.isDefault}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {selectedRole?.id ? `Edit Role: ${selectedRole.name}` : 'Create New Role'}
            </DialogTitle>
            <DialogDescription>
              Define the role name and select the permissions this role will have.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  value={selectedRole?.name || ''}
                  onChange={(e) => setSelectedRole(prev => (
                    prev ? { ...prev, name: e.target.value } : null
                  ))}
                  className="mt-1"
                  disabled={selectedRole?.isDefault && !selectedRole?.isEditable}
                />
              </div>
              <div>
                <Label htmlFor="role-description">Description</Label>
                <Input
                  id="role-description"
                  value={selectedRole?.description || ''}
                  onChange={(e) => setSelectedRole(prev => (
                    prev ? { ...prev, description: e.target.value } : null
                  ))}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <Label>Permissions</Label>
              <div className="border rounded-md mt-2 max-h-[400px] overflow-y-auto">
                {groupedPermissions.map((category) => (
                  <div key={category.id} className="border-b last:border-b-0">
                    <div className="p-3 bg-muted/50 font-medium">
                      {category.name}
                    </div>
                    <div className="p-3 space-y-3">
                      {category.permissions.map((permission) => (
                        <div key={permission.id} className="flex items-start space-x-3">
                          <Checkbox
                            id={permission.id}
                            checked={isPermissionSelected(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                          <div className="grid gap-1.5">
                            <Label
                              htmlFor={permission.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {permission.name}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole}>
              <Save className="h-4 w-4 mr-2" />
              {selectedRole?.id ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesManagementTab;
