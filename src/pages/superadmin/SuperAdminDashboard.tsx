import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  getOrganizations,
  getAllUsers,
  deleteOrganization as deleteOrganizationService,
  getAllSubscriptions,
} from '@/utils/supabase-helpers';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import OrganizationManagement from '@/components/admin/OrganizationManagement';
import { OrganizationCard } from '@/components/superadmin/OrganizationCard';
import { CreateOrganizationDialog } from '@/components/superadmin/CreateOrganizationDialog';
import { SubscriptionManagement } from '@/components/superadmin/SubscriptionManagement';
import SuperAdminAnalytics from '@/components/superadmin/SuperAdminAnalytics';
import {
  Profile,
  Organization,
  UserWithConfirmation,
} from '@/components/admin/types';
import {
  Users,
  Building2,
  BarChart3,
  Settings,
  CreditCard,
  Search,
  Plus,
  Filter,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { IsolationTest } from '@/components/debug/IsolationTest';
import { Phase3Summary } from '@/components/debug/Phase3Summary';
import { useAuthContext } from '@/context/AuthContext';

const SuperAdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<UserWithConfirmation[]>([]);
  const { logout } = useAuthContext();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const organizationsData = await getOrganizations();
      const usersData = await getAllUsers();
      const subscriptionsData = await getAllSubscriptions();
      console.log({ subscriptionsData });
      console.log({ organizationsData });
      const subscriptionMap = subscriptionsData.reduce((map, item) => {
        const existing = map.get(item.email);
        if (
          !existing ||
          new Date(item.next_billing_date) >
            new Date(existing.next_billing_date)
        ) {
          map.set(item.email, item);
        }
        return map;
      }, new Map());
      const convertedOrgs = (organizationsData || []).map((org) => {
        const subscriptionInfo = subscriptionMap.get(org.profile_email);
        return {
          id: org.organization_id,
          name: org.organization_name,
          subscription_level: org.subscription_level || 'trial',
          subscription_status: org.subscription_status || 'active',
          trial_ends_at: org.trial_ends_at || '',
          logo: org.logo || '',
          address: org.address || '',
          phone: org.phone || '',
          email: org.profile_email || '',
          user_id: org.profile_id || '',
          country: org.country || '',
          currency: org.currency || '',
          created_at: org.created_at || new Date().toISOString(),
          updated_at: org.updated_at || undefined,
          last_login: org.lastLogin || undefined,
          user_role: org.role || 'undefined',
          ...(subscriptionInfo && {
            next_billing_date: subscriptionInfo.next_billing_date,
            total_billed: subscriptionInfo.total_billed,
            billing_interval: subscriptionInfo.interval,
            suspended: subscriptionInfo.suspended,
          }),
        };
      }) as Organization[];
      setOrganizations(convertedOrgs);
      setUsers(usersData.users as UserWithConfirmation[]);
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
    return users?.filter((user) => user.organization_id === orgId).length;
  };

  const filteredOrganizations = organizations.filter(
    (org) =>
      org?.name?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
      org?.email?.toLowerCase().includes(searchTerm?.toLowerCase())
  );

  const filteredUsers = users?.filter(
    (user) =>
      user?.name?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchTerm?.toLowerCase())
  );

  const showSearchbar = activeTab === 'overview' || activeTab === 'users';

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage organizations, users, and subscriptions
          </p>
        </div>
        <div className="flex gap-2">
          {/* <Link to="/superadmin/data-debug">
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Data Debug
            </Button>
          </Link> */}
          <Button onClick={() => setCreateOrgOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Organization
          </Button>
        </div>
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
                  {
                    organizations.filter(
                      (org) =>
                        org.subscription_level !== 'trial' &&
                        org.subscription_status === 'active' &&
                        org.suspended !== true
                    ).length
                  }
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
                  {
                    organizations.filter(
                      (org) => org.subscription_level === 'trial'
                    ).length
                  }
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
            disabled={!showSearchbar}
          />
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center w-full">
          {/* Left: Regular tabs */}
          <TabsList className="grid grid-cols-4 flex-1">
            <TabsTrigger value="overview">Organizations</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Right: Logout button */}
          <div className="ml-4 flex items-stretch p-1">
            <Button
              variant="destructive"
              onClick={logout}
              className="h-full rounded-r-md"
            >
              Logout
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrganizations.map((org) => (
              <OrganizationCard
                key={`${org.id} ${org.email}`}
                organization={org}
                userCount={getUserCountForOrg(org.id)}
                onView={handleViewOrganization}
                onEdit={handleEditOrganization}
                onDelete={handleDeleteOrganization}
              />
            ))}
          </div>
          {(filteredOrganizations.length === 0 ||
            filteredUsers.length === 0) && (
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
            loadData={loadData}
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
