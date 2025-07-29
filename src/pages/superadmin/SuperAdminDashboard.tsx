
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  getOrganizations,
  getAllUsers,
  deleteOrganization as deleteOrganizationService
} from '@/utils/supabase-helpers';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import OrganizationManagement from '@/components/admin/OrganizationManagement';
import { OrganizationCard } from '@/components/superadmin/OrganizationCard';
import { CreateOrganizationDialog } from '@/components/superadmin/CreateOrganizationDialog';
import { SubscriptionManagement } from '@/components/superadmin/SubscriptionManagement';
import SuperAdminAnalytics from '@/components/superadmin/SuperAdminAnalytics';
import { Profile, Organization, UserWithConfirmation } from '@/components/admin/types';
import { 
  Users, 
  Building2, 
  BarChart3, 
  Settings, 
  CreditCard,
  Search,
  Plus,
  Filter
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SuperAdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<UserWithConfirmation[]>([]);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const organizationsData = await getOrganizations();
      const usersData = await getAllUsers();
      
      const convertedOrgs = (organizationsData || []).map(org => ({
        id: org.id,
        name: org.name,
        subscription_level: org.subscription_level || 'trial',
        subscription_status: org.subscription_status || 'active',
        trial_ends_at: org.trial_ends_at || '',
        logo: org.logo || '',
        address: org.address || '',
        phone: org.phone || '',
        email: org.email || '',
        country: org.country || '',
        currency: org.currency || '',
        created_at: org.created_at || new Date().toISOString(),
        updated_at: org.updated_at || undefined
      })) as Organization[];
      
      setOrganizations(convertedOrgs);
      setUsers(usersData as UserWithConfirmation[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOrganization = (orgId: string) => {
    // Navigate to organization detail view
    console.log('View organization:', orgId);
  };

  const handleEditOrganization = (org: Organization) => {
    // Open edit dialog
    console.log('Edit organization:', org);
  };

  const handleDeleteOrganization = async (orgId: string) => {
    if (!confirm('Are you sure you want to delete this organization?')) return;
    
    try {
      await deleteOrganizationService(orgId);
      toast({
        title: 'Organization deleted',
        description: 'Organization has been successfully deleted.',
      });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete organization',
        variant: 'destructive',
      });
    }
  };

  const getUserCountForOrg = (orgId: string) => {
    return users.filter(user => user.organization_id === orgId).length;
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage organizations, users, and subscriptions
          </p>
        </div>
        <Button onClick={() => setCreateOrgOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Organization
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Organizations
                </p>
                <p className="text-2xl font-bold">{organizations.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Users
                </p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Subscriptions
                </p>
                <p className="text-2xl font-bold">
                  {organizations.filter(org => org.subscription_status === 'active').length}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Trial Organizations
                </p>
                <p className="text-2xl font-bold">
                  {organizations.filter(org => org.subscription_level === 'trial').length}
                </p>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations, users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Organizations</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrganizations.map((org) => (
              <OrganizationCard
                key={org.id}
                organization={org}
                userCount={getUserCountForOrg(org.id)}
                onView={handleViewOrganization}
                onEdit={handleEditOrganization}
                onDelete={handleDeleteOrganization}
              />
            ))}
          </div>
          {filteredOrganizations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No organizations found</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users">
          <AdminUserManagement 
            users={filteredUsers}
            setUsers={setUsers}
            organizations={organizations}
            setOrganizations={setOrganizations}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="subscriptions">
          <SubscriptionManagement
            organizations={organizations}
            onUpdate={loadData}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <SuperAdminAnalytics />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                System configuration and maintenance tools will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateOrganizationDialog
        open={createOrgOpen}
        onOpenChange={setCreateOrgOpen}
        onSuccess={loadData}
      />
    </div>
  );
};

export default SuperAdminDashboard;
