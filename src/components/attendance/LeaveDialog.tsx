import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import LeaveForm, { LeaveFormData } from './LeaveForm';

interface LeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: LeaveFormData) => Promise<void>;
}

export function LeaveDialog({ open, onOpenChange, onSave }: LeaveDialogProps) {
  const handleSave = async (data: LeaveFormData) => {
    try {
      await onSave(data);
      onOpenChange(false);
    } catch (error) {
      console.error('LeaveDialog save failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Leave</DialogTitle>
          <DialogDescription>
            Record leave for a mechanic. It stays pending until an approver reviews it.
          </DialogDescription>
        </DialogHeader>
        <LeaveForm onSubmit={handleSave} />
      </DialogContent>
    </Dialog>
  );
}

export default LeaveDialog;
