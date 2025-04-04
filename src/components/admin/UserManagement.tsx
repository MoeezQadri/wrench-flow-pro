
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, UserCog } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { UserWithConfirmation, Organization } from './types';
import { enableUserWithoutConfirmation } from '@/utils/supabase-helpers';

interface UserManagementProps {
  users: UserWithConfirmation[];
  setUsers: React.Dispatch<React.SetStateAction<UserWithConfirmation[]>>;
  organizations: Organization[];
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({
  users,
  setUsers,
  organizations,
  searchTerm,
  setSearchTerm,
  isLoading
}) => {
  const [selectedUser, setSelectedUser] = useState<UserWithConfirmation | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [emailFilter, setEmailFilter] = useState('all');
  const { currentUser } = useAuthContext();
  
  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? user.is_active : !user.is_active);
    const matchesEmailConfirmation = emailFilter === 'all' || 
      (emailFilter === 'confirmed' ? !!user.email_confirmed_at : !user.email_confirmed_at);
    
    return matchesSearch && matchesRole && matchesStatus && matchesEmailConfirmation;
  });
  
  const handleEditUser = (user: UserWithConfirmation) => {
    setSelectedUser(user);
    setIsUserDialogOpen(true);
  };
  
  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: isActive } : user
      ));
      
      toast.success(`User status updated successfully`);
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };
  
  const handleToggleSuperAdmin = async (userId: string, isSuperAdmin: boolean) => {
    try {
      // Update the role in the profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ role: isSuperAdmin ? 'superuser' : 'owner' })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: isSuperAdmin ? 'superuser' : 'owner' } : user
      ));
      
      toast.success(`Super admin status ${isSuperAdmin ? 'granted' : 'revoked'}`);
    } catch (error: any) {
      console.error('Error updating super admin status:', error);
      toast.error('Failed to update super admin status');
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        // In a real app with proper permissions, we would call the admin-utils function
        // For now, we'll just update the UI
        setUsers(users.filter(user => user.id !== userId));
        toast.success('User deleted successfully');
      } catch (error: any) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };
  
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedUser) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({
            name: selectedUser.name,
            role: selectedUser.role,
            organization_id: selectedUser.organization_id,
            is_active: selectedUser.is_active
          })
          .eq('id', selectedUser.id);
        
        if (error) throw error;
        
        setUsers(users.map(user => 
          user.id === selectedUser.id ? selectedUser : user
        ));
        toast.success('User updated successfully');
      } else {
        // In a real app, we'd call an API to create a new user
        // For now, just show a success message
        toast.success('User creation would happen here in a real app');
      }
      
      setIsUserDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user: ' + error.message);
    }
  };
  
  const handleEnableUser = async (userId: string) => {
    try {
      await enableUserWithoutConfirmation(userId);
      
      // Update the local users state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, email_confirmed_at: new Date().toISOString() } : user
      ));
      
      toast.success('User enabled successfully');
    } catch (error: any) {
      console.error('Error enabling user:', error);
      toast.error('Failed to enable user');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button onClick={() => { setSelectedUser(null); setIsUserDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Owner
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
            <div className="flex gap-2 flex-wrap">
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
                  <SelectItem value="superuser">Superadmin</SelectItem>
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
              
              <Select value={emailFilter} onValueChange={setEmailFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Email confirmation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="confirmed">Email Confirmed</SelectItem>
                  <SelectItem value="unconfirmed">Email Not Confirmed</SelectItem>
                </SelectContent>
              </Select>
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
                <TableHead>Organization</TableHead>
                <TableHead>Email Status</TableHead>
                <TableHead>Account Status</TableHead>
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
                    {organizations.find(org => org.id === user.organization_id)?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {user.email_confirmed_at ? (
                      <Badge variant="default" className="bg-green-500">
                        Confirmed
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Unconfirmed
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-5 ml-2 text-xs"
                          onClick={() => handleEnableUser(user.id)}
                        >
                          Enable
                        </Button>
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Switch 
                        checked={!!user.is_active} 
                        onCheckedChange={(checked) => handleToggleStatus(user.id, checked)}
                        disabled={user.id === currentUser?.id} // Can't deactivate yourself
                      />
                      <span className="ml-2">{user.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditUser(user)}
                      disabled={user.id === currentUser?.id && user.role === 'superuser'} // Can't edit yourself if superuser
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={user.id === currentUser?.id} // Can't delete yourself
                    >
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

      {/* User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit User' : 'Add Owner'}</DialogTitle>
            <DialogDescription>
              {selectedUser 
                ? 'Edit the user details and permissions below.' 
                : 'Create a new organization owner.'}
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
                    onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value} as UserWithConfirmation)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={selectedUser?.email || ''} 
                    onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value} as UserWithConfirmation)}
                    required
                    disabled={!!selectedUser?.id} // Can't change email for existing users
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {selectedUser ? (
                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium">Role</label>
                    <Select 
                      value={selectedUser?.role || ''} 
                      onValueChange={(value) => setSelectedUser({...selectedUser, role: value} as UserWithConfirmation)}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="foreman">Foreman</SelectItem>
                        <SelectItem value="mechanic">Mechanic</SelectItem>
                        <SelectItem value="superuser">Superadmin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                
                <div className="space-y-2">
                  <label htmlFor="organization" className="text-sm font-medium">Organization</label>
                  <Select 
                    value={selectedUser?.organization_id || ''} 
                    onValueChange={(value) => setSelectedUser({...selectedUser, organization_id: value} as UserWithConfirmation)}
                  >
                    <SelectTrigger id="organization">
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map(org => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {selectedUser && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="isSuperAdmin" className="text-sm font-medium">Super Admin Access</label>
                    <Switch 
                      id="isSuperAdmin"
                      checked={selectedUser?.role === 'superuser'} 
                      onCheckedChange={(checked) => setSelectedUser({...selectedUser, role: checked ? 'superuser' : 'owner'} as UserWithConfirmation)}
                      disabled={selectedUser?.id === currentUser?.id} // Can't change your own status
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Super admins have access to the admin portal and can manage all organizations, users, and settings.
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>
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

export default UserManagement;
