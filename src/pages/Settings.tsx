
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, CreditCard, User, Users, ShieldCheck } from 'lucide-react';
import OrganizationSettingsTab from '@/components/settings/OrganizationSettingsTab';
import SubscriptionSettingsTab from '@/components/settings/SubscriptionSettingsTab';
import AccountSettingsTab from '@/components/settings/AccountSettingsTab';
import UserManagementTab from '@/components/settings/UserManagementTab';
import RolesManagementTab from '@/components/settings/RolesManagementTab';
import { useAuthContext } from '@/context/AuthContext';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('organization');
  const { currentUser } = useAuthContext();
  
  // Check if current user has permission to manage users and roles
  const canManageUsers = currentUser?.role === 'owner' || currentUser?.role === 'admin';
  const canManageRoles = currentUser?.role === 'owner';
  const canManageSubscription = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-background border">
          <TabsTrigger value="organization" className="data-[state=active]:bg-muted">
            <Building className="w-4 h-4 mr-2" />
            Organization
          </TabsTrigger>
          {canManageSubscription && (
            <TabsTrigger value="subscription" className="data-[state=active]:bg-muted">
              <CreditCard className="w-4 h-4 mr-2" />
              Subscription
            </TabsTrigger>
          )}
          <TabsTrigger value="account" className="data-[state=active]:bg-muted">
            <User className="w-4 h-4 mr-2" />
            Account
          </TabsTrigger>
          {canManageUsers && (
            <TabsTrigger value="users" className="data-[state=active]:bg-muted">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
          )}
          {canManageRoles && (
            <TabsTrigger value="roles" className="data-[state=active]:bg-muted">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Roles
            </TabsTrigger>
          )}
        </TabsList>
        
        {/* Organization Settings Tab */}
        <TabsContent value="organization" className="space-y-6">
          <OrganizationSettingsTab />
        </TabsContent>
        
        {/* Subscription Settings Tab - Only for admins/owners */}
        {canManageSubscription && (
          <TabsContent value="subscription" className="space-y-6">
            <SubscriptionSettingsTab />
          </TabsContent>
        )}
        
        {/* Account Settings Tab (including password reset) */}
        <TabsContent value="account" className="space-y-6">
          <AccountSettingsTab />
        </TabsContent>
        
        {/* User Management Tab */}
        {canManageUsers && (
          <TabsContent value="users" className="space-y-6">
            <UserManagementTab />
          </TabsContent>
        )}
        
        {/* Roles Management Tab */}
        {canManageRoles && (
          <TabsContent value="roles" className="space-y-6">
            <RolesManagementTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;
