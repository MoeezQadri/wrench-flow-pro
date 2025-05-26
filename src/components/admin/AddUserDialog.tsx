
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserWithConfirmation, Organization } from './types';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizations: Organization[];
  onUserAdded: (user: UserWithConfirmation) => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({
  open,
  onOpenChange,
  organizations,
  onUserAdded
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Enter user name" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter email" />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="mechanic">Mechanic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Add User
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
