import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDataContext } from '@/context/data/DataContext';
import { PayableDialog } from '@/components/payable/PayableDialog';
import { Payable } from '@/types';
import { CreditCard } from 'lucide-react';

interface MarkAsPaidButtonProps {
  expense: {
    id: string;
    payment_status?: string;
    amount: number;
    description?: string;
    vendor_name?: string;
  };
  onPaymentRecorded?: () => void;
}

export const MarkAsPaidButton: React.FC<MarkAsPaidButtonProps> = ({ 
  expense, 
  onPaymentRecorded 
}) => {
  const { payables, updateExpense, markPayableAsPaid } = useDataContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Find the payable related to this expense
  const relatedPayable = payables.find(p => p.expense_id === expense.id);

  const handleMarkAsPaid = async (payableId: string, paymentData: {
    amount: number;
    payment_method: string;
    payment_date?: string;
    notes?: string;
  }) => {
    try {
      // Mark the payable as paid
      await markPayableAsPaid(payableId, paymentData);
      
      // Update the expense payment status
      await updateExpense(expense.id, {
        payment_status: 'paid',
        payment_method: paymentData.payment_method as any,
      });

      onPaymentRecorded?.();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error marking expense as paid:', error);
    }
  };

  if (expense.payment_status === 'paid' || !relatedPayable) {
    return null;
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsDialogOpen(true)}
        className="h-8"
      >
        <CreditCard className="h-3 w-3 mr-1" />
        Mark as Paid
      </Button>

      <PayableDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        payable={relatedPayable}
        onMarkAsPaid={handleMarkAsPaid}
      />
    </>
  );
};