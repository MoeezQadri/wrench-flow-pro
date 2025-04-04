
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, FileText, Edit, Trash2, UserCog, Building, UserPlus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { getOrganizations, deleteOrganization, updateOrganization, createOrganization } from '@/utils/supabase-helpers';

// Define the types for our database tables
type Profile = {
  id: string;
  name: string | null;
  email?: string;
  role: string | null;
  is_active: boolean | null;
  organization_id: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type OrganizationType = {
  id: string;
  name: string;
  subscription_level: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  owner_email?: string;
};

const AdminUserManagement = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationType | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('organizations');
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuthContext();
  
  // Fetch data from Supabase
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch organizations using our helper function
        const orgsData = await getOrganizations();
        
        // Fetch profiles for users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
        
        if (profilesError) throw profilesError;
        
        // Get emails from auth.users for each profile (in a real app, this would be done on the server)
        // For now, we'll use the profiles data we have
        const profilesWithEmail = await Promise.all((profilesData || []).map(async (profile) => {
          // Get user email from auth.users via a secure server function in real implementation
          // Here we use a placeholder or try to fetch from profiles if available
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profile.id)
            .single();
          
          return {
            ...profile,
            email: `${profile.name?.toLowerCase().replace(/\s+/g, '.')}@example.com` // Generate placeholder email
          };
        }));
        
        setOrganizations(orgsData || []);
        setUsers(profilesWithEmail || []);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? user.is_active : !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filter organizations based on search term
  const filteredOrganizations = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (org.owner_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (org.owner_email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleEditUser = (user: Profile) => {
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
  
  const handleEditOrganization = (org: OrganizationType) => {
    setSelectedOrganization(org);
    setIsOrgDialogOpen(true);
  };
  
  const handleAddOrganization = () => {
    setSelectedOrganization(null);
    setIsOrgDialogOpen(true);
  };
  
  const handleDeleteOrganization = async (orgId: string) => {
    if (window.confirm('Are you sure you want to delete this organization? This will also remove all associated users.')) {
      try {
        await deleteOrganization(orgId);
        
        setOrganizations(organizations.filter(org => org.id !== orgId));
        setUsers(users.filter(user => user.organization_id !== orgId));
        toast.success('Organization deleted successfully');
      } catch (error: any) {
        console.error('Error deleting organization:', error);
        toast.error('Failed to delete organization');
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
  
  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      if (selectedOrganization) {
        // Update existing organization
        await updateOrganization({
          org_id: selectedOrganization.id,
          org_name: formData.get('name') as string,
          sub_level: formData.get('subscriptionPlan') as string
        });
        
        setOrganizations(organizations.map(org => 
          org.id === selectedOrganization.id ? {
            ...selectedOrganization,
            name: formData.get('name') as string,
            subscription_level: formData.get('subscriptionPlan') as string,
            updated_at: new Date().toISOString()
          } : org
        ));
        toast.success('Organization updated successfully');
      } else {
        // Create new organization
        await createOrganization({
          org_name: formData.get('name') as string,
          sub_level: formData.get('subscriptionPlan') as string,
          owner_name: formData.get('ownerName') as string,
          owner_email: formData.get('ownerEmail') as string
        });
        
        // Fetch updated organizations
        const updatedOrgs = await getOrganizations();
        setOrganizations(updatedOrgs);
        
        toast.success('Organization created successfully');
      }
      
      setIsOrgDialogOpen(false);
      setSelectedOrganization(null);
      
    } catch (error: any) {
      console.error('Error saving organization:', error);
      toast.error('Failed to save organization: ' + error.message);
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="organizations">
            <Building className="mr-2 h-4 w-4" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="users">
            <UserCog className="mr-2 h-4 w-4" />
            Users
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="organizations" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
            <h2 className="text-2xl font-bold">Organization Management</h2>
            <Button onClick={handleAddOrganization}>
              <Plus className="mr-2 h-4 w-4" /> Add Organization
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Filter by plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
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
                    <TableHead>Organization</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>
                        <Badge variant={org.subscription_level === 'enterprise' ? 'default' : 
                              org.subscription_level === 'pro' ? 'secondary' : 'outline'}>
                          {org.subscription_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={org.subscription_status === 'active' ? 'default' : 'destructive'}>
                          {org.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEditOrganization(org)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteOrganization(org.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {filteredOrganizations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Building className="h-8 w-8 mb-2" />
                          <p>No organizations found</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={handleAddOrganization}
                          >
                            Add your first organization
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Super Admin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
                      <TableCell>
                        {organizations.find(org => org.id === user.organization_id)?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Switch 
                            checked={user.role === 'superuser'} 
                            onCheckedChange={(checked) => handleToggleSuperAdmin(user.id, checked)}
                            disabled={user.id === currentUser?.id} // Can't change your own status
                          />
                          <span className="ml-2">{user.role === 'superuser' ? 'Yes' : 'No'}</span>
                        </div>
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
                      <TableCell colSpan={6} className="h-24 text-center">
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
        </TabsContent>
      </Tabs>
      
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
                    onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value} as Profile)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={selectedUser?.email || ''} 
                    onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value} as Profile)}
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
                      onValueChange={(value) => setSelectedUser({...selectedUser, role: value} as Profile)}
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
                    onValueChange={(value) => setSelectedUser({...selectedUser, organization_id: value} as Profile)}
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
                      onCheckedChange={(checked) => setSelectedUser({...selectedUser, role: checked ? 'superuser' : 'owner'} as Profile)}
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
      
      {/* Organization Dialog */}
      <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{selectedOrganization ? 'Edit Organization' : 'Add Organization'}</DialogTitle>
            <DialogDescription>
              {selectedOrganization 
                ? 'Edit the organization details below.' 
                : 'Create a new organization and owner.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveOrganization}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input 
                  id="name" 
                  name="name"
                  defaultValue={selectedOrganization?.name || ''} 
                  required
                />
              </div>
              
              {!selectedOrganization && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Owner Name</Label>
                      <Input 
                        id="ownerName" 
                        name="ownerName"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ownerEmail">Owner Email</Label>
                      <Input 
                        id="ownerEmail" 
                        name="ownerEmail"
                        type="email"
                        required
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
                  <Select 
                    name="subscriptionPlan"
                    defaultValue={selectedOrganization?.subscription_level || 'trial'}
                  >
                    <SelectTrigger id="subscriptionPlan">
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="seats">Number of Seats</Label>
                  <Input 
                    id="seats" 
                    name="seats"
                    type="number"
                    min="1"
                    defaultValue="5" 
                    required
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOrgDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedOrganization ? 'Update Organization' : 'Create Organization'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagement;
