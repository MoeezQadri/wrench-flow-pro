
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Users as UsersIcon, ShieldCheck, ShieldAlert } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { User, UserRole } from "@/types";
import { users, getCurrentUser, hasPermission } from "@/services/data-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const UsersPage = () => {
  const [usersList, setUsersList] = useState<User[]>(users);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const currentUser = getCurrentUser();

  // Check if current user has permission to manage users
  const canManageUsers = hasPermission(currentUser, 'users', 'manage');
  const canViewUsers = hasPermission(currentUser, 'users', 'view');

  if (!canViewUsers) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-muted-foreground">You don't have permission to view users.</p>
      </div>
    );
  }

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleToggleActive = (userId: string, active: boolean) => {
    if (!canManageUsers) {
      toast.error("You don't have permission to manage users");
      return;
    }
    
    setUsersList(prev => 
      prev.map(user => user.id === userId ? { ...user, isActive: active } : user)
    );
    
    toast.success(`User ${active ? 'activated' : 'deactivated'}`);
  };

  const handleSaveUser = (formData: React.FormEvent<HTMLFormElement>) => {
    formData.preventDefault();
    
    if (!canManageUsers) {
      toast.error("You don't have permission to manage users");
      return;
    }
    
    // Get form data
    const form = formData.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const role = (form.elements.namedItem('role') as HTMLSelectElement).value as UserRole;
    
    if (selectedUser) {
      // Update existing user
      setUsersList(prev => 
        prev.map(user => user.id === selectedUser.id ? 
          { ...user, name, email, role } : user
        )
      );
      toast.success("User updated successfully");
    } else {
      // Add new user
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        role,
        isActive: true,
        lastLogin: new Date().toISOString()
      };
      
      setUsersList(prev => [...prev, newUser]);
      toast.success("User added successfully");
    }
    
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        {canManageUsers && (
          <Button onClick={handleAddUser}>
            <Plus className="mr-1 h-4 w-4" />
            Add User
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Status</TableHead>
                {canManageUsers && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersList.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {user.role === 'owner' ? (
                        <ShieldCheck className="h-4 w-4 mr-1 text-yellow-500" />
                      ) : user.role === 'manager' ? (
                        <ShieldCheck className="h-4 w-4 mr-1 text-blue-500" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 mr-1 text-green-500" />
                      )}
                      <span className="capitalize">{user.role}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</TableCell>
                  <TableCell>
                    {canManageUsers ? (
                      <div className="flex items-center">
                        <Switch 
                          checked={user.isActive} 
                          onCheckedChange={(checked) => handleToggleActive(user.id, checked)}
                          disabled={user.id === currentUser.id} // Prevent deactivating yourself
                        />
                        <span className="ml-2">{user.isActive ? "Active" : "Inactive"}</span>
                      </div>
                    ) : (
                      <span className={user.isActive ? "text-green-600" : "text-red-600"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    )}
                  </TableCell>
                  {canManageUsers && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        disabled={user.id === currentUser.id && user.role === 'owner'} // Owners can't edit themselves
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {usersList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canManageUsers ? 6 : 5} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <UsersIcon className="w-12 h-12 mb-2 text-muted-foreground/60" />
                      <p>No users found</p>
                      {canManageUsers && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={handleAddUser}
                        >
                          Add your first user
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {selectedUser
                ? "Update the user's information below."
                : "Enter the details for the new user."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveUser}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={selectedUser?.name}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={selectedUser?.email}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue={selectedUser?.role || 'mechanic'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUser.role === 'owner' && (
                      <SelectItem value="owner">Owner</SelectItem>
                    )}
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="foreman">Foreman</SelectItem>
                    <SelectItem value="mechanic">Mechanic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedUser ? "Update" : "Add"} User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
