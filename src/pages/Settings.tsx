
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Building, CreditCard, User, FileText, Lock, ShieldCheck } from 'lucide-react';
import OrganizationSettingsTab from '@/components/settings/OrganizationSettingsTab';
import SubscriptionSettingsTab from '@/components/settings/SubscriptionSettingsTab';
import AccountSettingsTab from '@/components/settings/AccountSettingsTab';
import InvoiceSettingsTab from '@/components/settings/InvoiceSettingsTab';
import RolesManagementTab from '@/components/settings/RolesManagementTab';
import { useAuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/services/data-service';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('organization');
  const { currentUser } = useAuthContext();
  
  // Check if current user has permission to manage users or settings
  // Using 'users' instead of 'roles' since it's defined in RolePermissionMap
  const canManageRoles = hasPermission(currentUser, 'users', 'manage');

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
          <TabsTrigger value="subscription" className="data-[state=active]:bg-muted">
            <CreditCard className="w-4 h-4 mr-2" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:bg-muted">
            <User className="w-4 h-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="invoicing" className="data-[state=active]:bg-muted">
            <FileText className="w-4 h-4 mr-2" />
            Invoicing
          </TabsTrigger>
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
        
        {/* Subscription Settings Tab */}
        <TabsContent value="subscription" className="space-y-6">
          <SubscriptionSettingsTab />
        </TabsContent>
        
        {/* Account Settings Tab (including password reset) */}
        <TabsContent value="account" className="space-y-6">
          <AccountSettingsTab />
        </TabsContent>
        
        {/* Invoicing Settings Tab */}
        <TabsContent value="invoicing" className="space-y-6">
          <InvoiceSettingsTab />
        </TabsContent>
        
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
