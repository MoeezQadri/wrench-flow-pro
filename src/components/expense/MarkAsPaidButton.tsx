import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDataContext } from '@/context/data/DataContext';
import { PayableDialog } from '@/components/payable/PayableDialog';
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

  // Find the payable (bill) related to this expense
  const relatedPayable = payables.find(p => p.expense_id === expense.id);

  const handleMarkAsPaid = async (payableId: string, paymentData: {
    amount: number;
    payment_method: string;
    payment_date?: string;
    notes?: string;
  }) => {
    try {
      // Record the payment on the bill first; it returns the resulting state
      const updatedPayable = await markPayableAsPaid(payableId, paymentData);

      const billTotal = updatedPayable?.amount ?? expense.amount;
      const paid = updatedPayable?.paid_amount ?? 0;
      const fullyPaid = paid >= billTotal - 0.005;

      // Reflect the same state on the expense (partial stays partial)
      await updateExpense(expense.id, {
        payment_status: fullyPaid ? 'paid' : 'partial',
        payment_method: paymentData.payment_method as any,
      });

      onPaymentRecorded?.();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error recording expense payment:', error);
    }
  };

  const outstanding = relatedPayable
    ? Math.max(0, (relatedPayable.amount || 0) - (relatedPayable.paid_amount || 0))
    : 0;

  if (!relatedPayable || outstanding <= 0.005) {
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
        Record Payment
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
