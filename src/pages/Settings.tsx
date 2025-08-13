import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, CreditCard, User, Users } from 'lucide-react';
import OrganizationSettingsTab from '@/components/settings/OrganizationSettingsTab';
import SubscriptionSettingsTab from '@/components/settings/SubscriptionSettingsTab';
import AccountSettingsTab from '@/components/settings/AccountSettingsTab';
import UserManagementTab from '@/components/settings/UserManagementTab';
import { useAuthContext } from '@/context/AuthContext';
import { canManageUsers, canManageSettings, canManageSubscription } from '@/utils/permissions';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('organization');
  const { currentUser } = useAuthContext();
  
  // Check if current user has permission to manage users and roles
  const userCanManageUsers = canManageUsers(currentUser);
  const userCanManageSettings = canManageSettings(currentUser);
  const userCanManageSubscription = canManageSubscription(currentUser);

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
          {userCanManageSubscription && (
            <TabsTrigger value="subscription" className="data-[state=active]:bg-muted">
              <CreditCard className="w-4 h-4 mr-2" />
              Subscription
            </TabsTrigger>
          )}
          <TabsTrigger value="account" className="data-[state=active]:bg-muted">
            <User className="w-4 h-4 mr-2" />
            Account
          </TabsTrigger>
          {userCanManageUsers && (
            <TabsTrigger value="users" className="data-[state=active]:bg-muted">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
          )}
        </TabsList>
        
        {/* Organization Settings Tab */}
        <TabsContent value="organization" className="space-y-6">
          <OrganizationSettingsTab />
        </TabsContent>
        
        {/* Subscription Settings Tab - Only for admins/owners */}
        {userCanManageSubscription && (
          <TabsContent value="subscription" className="space-y-6">
            <SubscriptionSettingsTab />
          </TabsContent>
        )}
        
        {/* Account Settings Tab (including password reset) */}
        <TabsContent value="account" className="space-y-6">
          <AccountSettingsTab />
        </TabsContent>
        
        {/* User Management Tab */}
        {userCanManageUsers && (
          <TabsContent value="users" className="space-y-6">
            <UserManagementTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;