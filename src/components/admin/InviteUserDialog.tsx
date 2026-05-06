import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Organization, UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { USERS_ALLOWED_IN_PLAN } from '@/utils/global-data';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: { email: string; id: string }[]; // existing users
  organizations: Organization[]; // list of org names
  loadData: () => Promise<void>;
  superAdminDashboardReq?: boolean; // optional prop
}

const userRoles: UserRole[] = [
  'owner',
  'manager',
  'mechanic',
  'admin',
  'superuser',
  'superadmin',
  'foreman',
];

const InviteUserDialog: React.FC<InviteUserDialogProps> = ({
  open,
  onOpenChange,
  users,
  organizations,
  loadData,
  superAdminDashboardReq = true,
}) => {
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('foreman');
  const [invitingUser, setInvitingUser] = useState(false);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check required fields
    if (!email || !selectedOrg) {
      toast({
        title: 'Error',
        description: 'Email and organization are required',
        variant: 'destructive',
      });
      return;
    }

    // Check if the email already exists in users array
    const emailExists = users.some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (emailExists) {
      toast({
        title: 'Error',
        description: 'This email already exists',
        variant: 'destructive',
      });
      return;
    }

    const org = organizations.find((o) => o.id === selectedOrg);
    if (!org) {
      toast({
        title: 'Error',
        description: 'Selected organization not found',
        variant: 'destructive',
      });
      return;
    }

    // Filter users that belong to this organization
    const orgUsers = users.filter((u: any) => u.organization_id === org.id);

    // Check against plan limit
    const maxUsers =
      USERS_ALLOWED_IN_PLAN[
        org.subscription_level as keyof typeof USERS_ALLOWED_IN_PLAN
      ] ?? 0;
    if (orgUsers.length >= maxUsers) {
      toast({
        title: 'Error',
        description: `This organization has reached its user limit for the ${org.subscription_level} plan. \n Please upgrade the subscription to add more users.`,
        variant: 'destructive',
      });
      return;
    }

    setInvitingUser(true);

    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email,
          role: selectedRole,
          organizationId: selectedOrg,
          superAdminDashboardReq,
        },
      });

      if (error) {
        console.error('Error inviting user:', error);
        toast({
          title: 'Error',
          description: error?.message || 'Failed to send invitation',
          variant: 'destructive',
        });
      } else if (data?.success) {
        toast({
          title: 'Invitation sent',
          description: `Invitation email has been sent to ${email}.`,
        });
        // Reset form
        setEmail('');
        setSelectedOrg('');
        setSelectedRole('foreman');
        await loadData();
      } else {
        toast({
          title: 'Error',
          description: data?.error || 'Failed to send invitation',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error inviting user:', err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setInvitingUser(false);
      onOpenChange(false); // close dialog for better UX
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleInviteUser} className="space-y-4">
          {/* Email input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          {/* Organization Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  new Map(organizations.map((org) => [org.id, org])).values()
                ).map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {userRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={invitingUser}>
              <Mail className="mr-2 h-4 w-4" />
              {invitingUser ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserDialog;
