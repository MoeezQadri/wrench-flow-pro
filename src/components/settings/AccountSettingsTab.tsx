
import { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Lock, AlertTriangle, Trash } from 'lucide-react';
import { changePassword } from '@/services/auth-service';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const AccountSettingsTab = () => {
  const { currentUser, logout } = useAuthContext();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const navigate = useNavigate();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('You must be logged in to change your password');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = changePassword(currentUser.id, currentPassword, newPassword);
      
      if (success) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error('Current password is incorrect');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser?.id) {
      toast.error('You must be logged in to delete your account');
      return;
    }

    if (currentUser.role !== 'owner') {
      toast.error('Only organization owners can delete accounts');
      return;
    }

    setIsDeletingAccount(true);

    try {
      // First delete organization if user is an owner
      if (currentUser.organizationId && currentUser.role === 'owner') {
        // Delete the organization using the edge function
        const { error: orgError } = await supabase.functions.invoke('admin-utils', {
          body: {
            action: 'delete_organization',
            params: { org_id: currentUser.organizationId }
          }
        });

        if (orgError) {
          toast.error(`Failed to delete organization: ${orgError.message}`);
          setIsDeletingAccount(false);
          return;
        }
      }

      // Now delete the user account
      const { error } = await supabase.auth.admin.deleteUser(currentUser.id);

      if (error) {
        toast.error(`Failed to delete account: ${error.message}`);
      } else {
        toast.success('Your account has been deleted');
        setShowDeleteDialog(false);
        // Log out and redirect to login page
        await logout();
        navigate('/auth/login');
      }
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'An error occurred while deleting your account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">You must be logged in to view account settings</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your account details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm">Name</Label>
                <p className="font-medium">{currentUser.name}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground text-sm">Email</Label>
                <p className="font-medium">{currentUser.email}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground text-sm">Role</Label>
                <p className="font-medium capitalize">{currentUser.role}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground text-sm">Last Login</Label>
                <p className="font-medium">
                  {currentUser.lastLogin ? new Date(currentUser.lastLogin).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {currentUser.role === 'owner' && (
            <div className="mt-6 pt-6 border-t">
              <CardTitle className="flex items-center text-red-600 mb-4">
                <Trash className="mr-2 h-5 w-5" />
                Danger Zone
              </CardTitle>
              <div className="flex flex-col space-y-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Permanently delete your account and organization. This action cannot be undone.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full sm:w-auto"
                >
                  Delete Account & Organization
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="mr-2 h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters long
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Changing Password...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="text-red-600 mr-2 h-5 w-5" />
              Delete Account & Organization
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will permanently delete your account, 
              organization data, and remove all associated users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="deleteConfirmPassword" className="mb-2 block">
              Please type your password to confirm
            </Label>
            <Input
              id="deleteConfirmPassword"
              type="password"
              placeholder="Enter your password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="mb-4"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAccount}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingAccount || !deletePassword}
            >
              {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AccountSettingsTab;
