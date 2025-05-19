
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SuperAdminRoles from '@/components/superadmin/SuperAdminRoles';
import SuperAdminSettings from '@/components/superadmin/SuperAdminSettings';
import SuperAdminAnalytics from '@/components/superadmin/SuperAdminAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/context/AuthContext';
import OrganizationManagement from '@/components/admin/OrganizationManagement';
import UserManagement from '@/components/admin/UserManagement';
import SubscriptionPlansManagement from '@/components/admin/SubscriptionPlansManagement';
import DataCleanupPanel from '@/components/admin/DataCleanupPanel';
import { toast } from 'sonner';
import { Organization } from '@/components/admin/types';

import { Activity, Building, Globe, Users, Zap } from 'lucide-react';

// Mock data for organizations
const initialOrganizations: Organization[] = [
  {
    id: 'org-1',
    name: 'Acme Auto Shop',
    subscription_level: 'Professional',
    subscription_status: 'active',
    created_at: '2022-04-15T10:30:00Z',
    updated_at: '2022-04-15T10:30:00Z',
    owner_name: 'John Doe',
    owner_email: 'john@acme.com'
  },
  {
    id: 'org-2',
    name: 'City Mechanics',
    subscription_level: 'Basic',
    subscription_status: 'active',
    created_at: '2022-06-22T14:45:00Z',
    updated_at: '2022-06-22T14:45:00Z',
    owner_name: 'Jane Smith',
    owner_email: 'jane@citymechanics.com'
  },
  {
    id: 'org-3',
    name: 'Express Repairs',
    subscription_level: 'Professional',
    subscription_status: 'suspended',
    created_at: '2022-03-10T09:15:00Z',
    updated_at: '2022-03-10T09:15:00Z',
    owner_name: 'Bob Johnson',
    owner_email: 'bob@expressrepairs.com'
  }
];

const SuperAdminDashboard = () => {
  const { currentUser } = useAuthContext();
  const [activeTab, setActiveTab] = useState('analytics');
  
  // State for organizations
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock users for UserManagement
  const [users, setUsers] = useState([
    { id: 'user-1', name: 'John Doe', email: 'john@acme.com', role: 'owner', organization: 'Acme Auto Shop' },
    { id: 'user-2', name: 'Jane Smith', email: 'jane@citymechanics.com', role: 'owner', organization: 'City Mechanics' }
  ]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Function to receive data from OrganizationManagement component
  const handleOrganizationUpdate = (updatedOrgs: Organization[]) => {
    setOrganizations(updatedOrgs);
    toast.success('Organizations updated successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">SuperAdmin Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          Logged in as {currentUser?.email || 'Super Admin'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
            <p className="text-xs text-muted-foreground">
              {organizations.filter(org => org.subscription_status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Subscription Revenue</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$9,432</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-1 md:grid-cols-5 h-auto">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-4">
          <SuperAdminAnalytics />
        </TabsContent>

        <TabsContent value="organizations" className="mt-4">
          <OrganizationManagement
            organizations={organizations}
            setOrganizations={setOrganizations}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isLoading={isLoading}
          />
          <div className="mt-4">
            <SubscriptionPlansManagement />
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <UserManagement 
            users={users}
            setUsers={setUsers}
            organizations={organizations}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isLoading={isLoading}
          />
          <div className="mt-4">
            <DataCleanupPanel />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <SuperAdminSettings />
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <SuperAdminRoles />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminDashboard;
