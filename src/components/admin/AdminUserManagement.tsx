
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, FileText, Edit, Trash2, UserCog } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserRole } from '@/types';

// Sample data - in a real app, this would come from your API
const usersData = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'owner', status: 'active', lastActive: '2023-06-14T12:30:00Z', subscriptionPlan: 'Enterprise' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'manager', status: 'active', lastActive: '2023-06-13T10:15:00Z', subscriptionPlan: 'Pro' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'mechanic', status: 'inactive', lastActive: '2023-05-20T09:45:00Z', subscriptionPlan: 'Basic' },
  { id: '4', name: 'Alice Williams', email: 'alice@example.com', role: 'foreman', status: 'active', lastActive: '2023-06-12T14:20:00Z', subscriptionPlan: 'Pro' },
  { id: '5', name: 'Charlie Brown', email: 'charlie@example.com', role: 'mechanic', status: 'active', lastActive: '2023-06-10T11:10:00Z', subscriptionPlan: 'Basic' },
];

const AdminUserManagement = () => {
  const [users, setUsers] = useState(usersData);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });
  
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };
  
  const handleToggleStatus = (userId: string, isActive: boolean) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: isActive ? 'active' : 'inactive' } : user
    ));
    
    toast.success(`User status updated successfully`);
  };
  
  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    }
  };
  
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUser) {
      // Update existing user
      setUsers(users.map(user => 
        user.id === selectedUser.id ? selectedUser : user
      ));
      toast.success('User updated successfully');
    } else {
      // Add new user logic would go here
      toast.success('User added successfully');
    }
    
    setIsDialogOpen(false);
    setSelectedUser(null);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="foreman">Foreman</SelectItem>
                  <SelectItem value="mechanic">Mechanic</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>
                    <Badge variant={user.subscriptionPlan === 'Enterprise' ? 'default' : 
                          user.subscriptionPlan === 'Pro' ? 'secondary' : 'outline'}>
                      {user.subscriptionPlan}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.lastActive).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Switch 
                        checked={user.status === 'active'} 
                        onCheckedChange={(checked) => handleToggleStatus(user.id, checked)}
                      />
                      <span className="ml-2">{user.status === 'active' ? 'Active' : 'Inactive'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <UserCog className="h-8 w-8 mb-2" />
                      <p>No users found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* User Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {selectedUser 
                ? 'Edit the user details and permissions below.' 
                : 'Fill in the user details to create a new user.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Name</label>
                  <Input 
                    id="name" 
                    value={selectedUser?.name || ''} 
                    onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={selectedUser?.email || ''} 
                    onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="role" className="text-sm font-medium">Role</label>
                  <Select 
                    value={selectedUser?.role} 
                    onValueChange={(value) => setSelectedUser({...selectedUser, role: value})}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="foreman">Foreman</SelectItem>
                      <SelectItem value="mechanic">Mechanic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium">Status</label>
                  <Select 
                    value={selectedUser?.status} 
                    onValueChange={(value) => setSelectedUser({...selectedUser, status: value})}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="subscriptionPlan" className="text-sm font-medium">Subscription Plan</label>
                <Select 
                  value={selectedUser?.subscriptionPlan} 
                  onValueChange={(value) => setSelectedUser({...selectedUser, subscriptionPlan: value})}
                >
                  <SelectTrigger id="subscriptionPlan">
                    <SelectValue placeholder="Select subscription plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basic">Basic</SelectItem>
                    <SelectItem value="Pro">Pro</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagement;
