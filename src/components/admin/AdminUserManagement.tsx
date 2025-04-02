import React, { useState } from 'react';
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
import { UserRole, Organization } from '@/types';

// Sample data - in a real app, this would come from your API
const usersData = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'owner', status: 'active', lastActive: '2023-06-14T12:30:00Z', subscriptionPlan: 'Enterprise', organizationId: 'org-1', isSuperAdmin: false },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'manager', status: 'active', lastActive: '2023-06-13T10:15:00Z', subscriptionPlan: 'Pro', organizationId: 'org-1', isSuperAdmin: false },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'mechanic', status: 'inactive', lastActive: '2023-05-20T09:45:00Z', subscriptionPlan: 'Basic', organizationId: 'org-2', isSuperAdmin: false },
  { id: '4', name: 'Alice Williams', email: 'alice@example.com', role: 'foreman', status: 'active', lastActive: '2023-06-12T14:20:00Z', subscriptionPlan: 'Pro', organizationId: 'org-2', isSuperAdmin: false },
  { id: '5', name: 'Charlie Brown', email: 'charlie@example.com', role: 'mechanic', status: 'active', lastActive: '2023-06-10T11:10:00Z', subscriptionPlan: 'Basic', organizationId: 'org-3', isSuperAdmin: true },
];

const organizationsData = [
  { id: 'org-1', name: 'Auto Shop Pro', subscriptionPlan: 'Enterprise', status: 'active', ownerName: 'John Doe', ownerEmail: 'john@example.com', createdAt: '2023-01-15T09:00:00Z', seats: 10, activeSeats: 5 },
  { id: 'org-2', name: 'Mechanic Masters', subscriptionPlan: 'Pro', status: 'active', ownerName: 'Sarah Connor', ownerEmail: 'sarah@example.com', createdAt: '2023-02-20T14:30:00Z', seats: 5, activeSeats: 3 },
  { id: 'org-3', name: 'Quick Fix Garage', subscriptionPlan: 'Basic', status: 'inactive', ownerName: 'Mike Tyson', ownerEmail: 'mike@example.com', createdAt: '2023-03-10T11:45:00Z', seats: 3, activeSeats: 2 },
];

const AdminUserManagement = () => {
  const [users, setUsers] = useState(usersData);
  const [organizations, setOrganizations] = useState(organizationsData);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('organizations');
  
  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filter organizations based on search term
  const filteredOrganizations = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsUserDialogOpen(true);
  };
  
  const handleToggleStatus = (userId: string, isActive: boolean) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: isActive ? 'active' : 'inactive' } : user
    ));
    
    toast.success(`User status updated successfully`);
  };
  
  const handleToggleSuperAdmin = (userId: string, isSuperAdmin: boolean) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, isSuperAdmin } : user
    ));
    
    toast.success(`Super admin status ${isSuperAdmin ? 'granted' : 'revoked'}`);
  };
  
  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    }
  };
  
  const handleEditOrganization = (org: any) => {
    setSelectedOrganization(org);
    setIsOrgDialogOpen(true);
  };
  
  const handleAddOrganization = () => {
    setSelectedOrganization(null);
    setIsOrgDialogOpen(true);
  };
  
  const handleDeleteOrganization = (orgId: string) => {
    if (window.confirm('Are you sure you want to delete this organization? This will also remove all associated users.')) {
      setOrganizations(organizations.filter(org => org.id !== orgId));
      // Also remove users associated with this organization
      setUsers(users.filter(user => user.organizationId !== orgId));
      toast.success('Organization deleted successfully');
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
      // Add new owner user
      const newUser = {
        id: `user-${Date.now()}`,
        name: selectedUser?.name || '',
        email: selectedUser?.email || '',
        role: 'owner',
        status: 'active',
        lastActive: new Date().toISOString(),
        subscriptionPlan: selectedUser?.subscriptionPlan || 'Basic',
        organizationId: selectedUser?.organizationId || '',
        isSuperAdmin: selectedUser?.isSuperAdmin || false
      };
      
      setUsers([...users, newUser]);
      toast.success('Owner added successfully');
    }
    
    setIsUserDialogOpen(false);
    setSelectedUser(null);
  };
  
  const handleSaveOrganization = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const orgData = {
      name: formData.get('name') as string,
      ownerName: formData.get('ownerName') as string,
      ownerEmail: formData.get('ownerEmail') as string,
      subscriptionPlan: formData.get('subscriptionPlan') as string,
      seats: parseInt(formData.get('seats') as string || '0'),
      status: 'active',
    };
    
    if (!orgData.name || !orgData.ownerName || !orgData.ownerEmail) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (selectedOrganization) {
      // Update existing organization
      const updatedOrg = {
        ...selectedOrganization,
        name: orgData.name,
        subscriptionPlan: orgData.subscriptionPlan,
        seats: orgData.seats,
      };
      
      setOrganizations(organizations.map(org => 
        org.id === selectedOrganization.id ? updatedOrg : org
      ));
      toast.success('Organization updated successfully');
    } else {
      // Create new organization and owner
      const newOrgId = `org-${Date.now()}`;
      const newOrg = {
        id: newOrgId,
        name: orgData.name,
        subscriptionPlan: orgData.subscriptionPlan,
        status: 'active',
        ownerName: orgData.ownerName,
        ownerEmail: orgData.ownerEmail,
        createdAt: new Date().toISOString(),
        seats: orgData.seats,
        activeSeats: 1, // Start with just the owner
      };
      
      // Create the owner user
      const newOwner = {
        id: `user-${Date.now()}`,
        name: orgData.ownerName,
        email: orgData.ownerEmail,
        role: 'owner' as UserRole,
        status: 'active',
        lastActive: new Date().toISOString(),
        subscriptionPlan: orgData.subscriptionPlan,
        organizationId: newOrgId,
        isSuperAdmin: false,
      };
      
      setOrganizations([...organizations, newOrg]);
      setUsers([...users, newOwner]);
      
      toast.success('Organization and owner created successfully');
    }
    
    setIsOrgDialogOpen(false);
    setSelectedOrganization(null);
  };
  
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
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                      <SelectItem value="Pro">Pro</SelectItem>
                      <SelectItem value="Basic">Basic</SelectItem>
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
                    <TableHead>Owner</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>{org.ownerName} ({org.ownerEmail})</TableCell>
                      <TableCell>
                        <Badge variant={org.subscriptionPlan === 'Enterprise' ? 'default' : 
                              org.subscriptionPlan === 'Pro' ? 'secondary' : 'outline'}>
                          {org.subscriptionPlan}
                        </Badge>
                      </TableCell>
                      <TableCell>{org.activeSeats} / {org.seats}</TableCell>
                      <TableCell>{new Date(org.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={org.status === 'active' ? 'default' : 'destructive'}>
                          {org.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
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
                      <TableCell colSpan={7} className="h-24 text-center">
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
                    <TableHead>Email</TableHead>
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
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
                      <TableCell>
                        {organizations.find(org => org.id === user.organizationId)?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Switch 
                            checked={user.isSuperAdmin} 
                            onCheckedChange={(checked) => handleToggleSuperAdmin(user.id, checked)}
                          />
                          <span className="ml-2">{user.isSuperAdmin ? 'Yes' : 'No'}</span>
                        </div>
                      </TableCell>
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
                {selectedUser ? (
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
                ) : null}
                
                <div className="space-y-2">
                  <label htmlFor="organization" className="text-sm font-medium">Organization</label>
                  <Select 
                    value={selectedUser?.organizationId || ''} 
                    onValueChange={(value) => setSelectedUser({...selectedUser, organizationId: value})}
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
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="isSuperAdmin" className="text-sm font-medium">Super Admin Access</label>
                  <Switch 
                    id="isSuperAdmin"
                    checked={selectedUser?.isSuperAdmin || false} 
                    onCheckedChange={(checked) => setSelectedUser({...selectedUser, isSuperAdmin: checked})}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Super admins have access to the admin portal and can manage all organizations, users, and settings.
                </p>
              </div>
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
                    defaultValue={selectedOrganization?.subscriptionPlan || 'Basic'}
                  >
                    <SelectTrigger id="subscriptionPlan">
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="Pro">Pro</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
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
                    defaultValue={selectedOrganization?.seats || '5'} 
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
