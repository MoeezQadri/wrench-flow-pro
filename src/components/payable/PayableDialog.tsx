import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PayableForm } from './PayableForm';
import { Payable } from '@/types';

interface PayableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payable?: Payable | null;
  onPayableAdded?: (payable: Payable) => void;
  onPayableUpdated?: (payable: Payable) => void;
}

export const PayableDialog: React.FC<PayableDialogProps> = ({
  open,
  onOpenChange,
  payable,
  onPayableAdded,
  onPayableUpdated,
}) => {
  const handleSuccess = (payable: Payable) => {
    if (payable.id && onPayableUpdated) {
      onPayableUpdated(payable);
    } else if (onPayableAdded) {
      onPayableAdded(payable);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {payable ? 'Edit Payable' : 'Add New Payable'}
          </DialogTitle>
        </DialogHeader>
        <PayableForm
          payable={payable}
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};