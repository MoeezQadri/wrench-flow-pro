import React from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const AccountSettingsTab: React.FC = () => {
  const { currentUser: user } = useAuthContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={user?.name || ''}
            disabled
            className="bg-gray-50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={user?.email || ''}
            disabled
            className="bg-gray-50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            value={user?.role || ''}
            disabled
            className="bg-gray-50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastLogin">Last Login</Label>
          <Input
            id="lastLogin"
            value={user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
            disabled
            className="bg-gray-50"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountSettingsTab;
