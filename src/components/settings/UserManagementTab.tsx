import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Mail, Pencil, Trash2, Users, KeyRound } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface OrganizationUser {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  lastLogin?: string;
  email?: string; // Add email field for password resets
}

// Load roles dynamically from database
const useAvailableRoles = () => {
  const [roles, setRoles] = useState([
    { value: 'owner', label: 'Owner', description: 'Full access to all features' },
    { value: 'admin', label: 'Admin', description: 'Can manage users and settings' },
    { value: 'manager', label: 'Manager', description: 'Can manage operations and view reports' },
    { value: 'member', label: 'Member', description: 'Basic access to core features' },
  ]);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .not('role', 'is', null);
        
        if (!error && data) {
          const uniqueRoles = [...new Set(data.map(item => item.role))];
          const predefinedRoles = [
            { value: 'owner', label: 'Owner', description: 'Full access to all features' },
            { value: 'admin', label: 'Admin', description: 'Can manage users and settings' },
            { value: 'manager', label: 'Manager', description: 'Can manage operations and view reports' },
            { value: 'member', label: 'Member', description: 'Basic access to core features' },
          ];
          
          // Add any additional roles found in database that aren't predefined
          const additionalRoles = uniqueRoles
            .filter(role => !predefinedRoles.some(pr => pr.value === role))
            .map(role => ({ 
              value: role, 
              label: role.charAt(0).toUpperCase() + role.slice(1), 
              description: `${role.charAt(0).toUpperCase() + role.slice(1)} role` 
            }));
          
          setRoles([...predefinedRoles, ...additionalRoles]);
        }
      } catch (error) {
        console.error('Error loading roles:', error);
      }
    };
    
    loadRoles();
  }, []);

  return roles;
};

const UserManagementTab = () => {
  const { currentUser, session } = useAuthContext();
  const availableRoles = useAvailableRoles();
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<OrganizationUser | null>(null);
  
  // Form states
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('member');
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState('');

  useEffect(() => {
    loadUsers();
  }, [currentUser?.organization_id]);

  const loadUsers = async () => {
    if (!currentUser?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      // For now, we'll just get the basic profile data
      // In a production app, you'd want to create a proper view or function
      // that joins profiles with auth.users to get email addresses
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', currentUser.organization_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users');
      } else {
        // For now, we'll use the current user's email for demonstration
        // In production, you'd get each user's email from the join
        const transformedUsers = (usersData || []).map(user => ({
          ...user,
          email: user.id === currentUser?.id ? session?.user?.email : `user-${user.id.slice(0,8)}@example.com`
        }));
        setUsers(transformedUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserEmail || !currentUser?.organization_id) {
      toast.error('Email and organization are required');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: newUserEmail,
          role: newUserRole,
          organizationId: currentUser.organization_id
        }
      });

      if (error) {
        console.error('Error inviting user:', error);
        toast.error(error.message || 'Failed to send invitation');
      } else if (data?.success) {
        toast.success(`Invitation sent to ${newUserEmail}`);
        setNewUserEmail('');
        setNewUserRole('member');
        setInviteDialogOpen(false);
      } else {
        toast.error(data?.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Failed to send invitation');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editUserName,
          role: editUserRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id);

      if (error) {
        console.error('Error updating user:', error);
        toast.error('Failed to update user');
      } else {
        toast.success('User updated successfully');
        await loadUsers();
        setDialogOpen(false);
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error deactivating user:', error);
        toast.error('Failed to deactivate user');
      } else {
        toast.success('User deactivated successfully');
        await loadUsers();
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error('Failed to deactivate user');
    }
  };

  const handleResetPassword = async (userEmail: string) => {
    if (!confirm('Send password reset email to this user?')) return;
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        console.error('Error sending password reset:', error);
        toast.error('Failed to send password reset email');
      } else {
        toast.success('Password reset email sent successfully');
      }
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('Failed to send password reset email');
    }
  };

  const openEditDialog = (user: OrganizationUser) => {
    setEditingUser(user);
    setEditUserName(user.name);
    setEditUserRole(user.role);
    setDialogOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'manager': return 'bg-green-100 text-green-800';
      case 'member': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-center">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Users List Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Organization Users
              </CardTitle>
              <CardDescription>
                Manage users and their roles in your organization
              </CardDescription>
            </div>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInviteUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div>
                              <div className="font-medium">{role.label}</div>
                              <div className="text-sm text-muted-foreground">{role.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      <Mail className="mr-2 h-4 w-4" />
                      Send Invitation
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {availableRoles.find(r => r.value === user.role)?.label || user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                        disabled={user.id === currentUser?.id && user.role === 'owner'} // Owner can't edit their own role
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {user.id !== currentUser?.id && user.email && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(user.email!)}
                          title="Send password reset email"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                      )}
                      {user.id !== currentUser?.id && user.is_active && user.role !== 'owner' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeactivateUser(user.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select value={editUserRole} onValueChange={setEditUserRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <div className="font-medium">{role.label}</div>
                        <div className="text-sm text-muted-foreground">{role.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementTab;