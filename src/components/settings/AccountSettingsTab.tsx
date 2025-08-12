import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { User, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AccountSettingsTab: React.FC = () => {
  const { currentUser, refreshProfile } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser?.id) {
      toast.error('User not found');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile');
      } else {
        toast.success('Profile updated successfully');
        await refreshProfile();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={currentUser?.role || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSettingsTab;