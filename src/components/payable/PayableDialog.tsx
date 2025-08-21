import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Payable } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface PayableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payable?: Payable;
  onPayableUpdated?: (payable: Payable) => void;
  onMarkAsPaid?: (id: string, paymentData: {
    amount: number;
    payment_method: string;
    payment_date?: string;
    notes?: string;
  }) => Promise<void>;
}

export const PayableDialog: React.FC<PayableDialogProps> = ({
  open,
  onOpenChange,
  payable,
  onPayableUpdated,
  onMarkAsPaid,
}) => {
  const [paymentAmount, setPaymentAmount] = useState(payable?.amount || 0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleMarkAsPaid = async () => {
    if (!payable || !onMarkAsPaid) return;

    if (!paymentMethod) {
      toast({
        title: "Error",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    if (paymentAmount <= 0) {
      toast({
        title: "Error",
        description: "Payment amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onMarkAsPaid(payable.id, {
        amount: paymentAmount,
        payment_method: paymentMethod,
        payment_date: paymentDate,
        notes,
      });

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPaymentAmount(payable?.amount || 0);
    setPaymentMethod('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  const outstandingAmount = (payable?.amount || 0) - (payable?.paid_amount || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {payable?.status === 'paid' ? 'Payment Details' : 'Record Payment'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Payable Details</Label>
            <div className="mt-2 p-3 border rounded-md bg-muted/50">
              <p><strong>Description:</strong> {payable?.description}</p>
              <p><strong>Total Amount:</strong> ${payable?.amount?.toFixed(2)}</p>
              <p><strong>Outstanding:</strong> ${outstandingAmount.toFixed(2)}</p>
              {payable?.due_date && (
                <p><strong>Due Date:</strong> {new Date(payable.due_date).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {payable?.status !== 'paid' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="paymentAmount">Payment Amount</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  max={outstandingAmount}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any payment notes..."
                />
              </div>
            </>
          )}

          {payable?.status === 'paid' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Information</Label>
              <div className="p-3 border rounded-md bg-green-50">
                <p><strong>Amount Paid:</strong> ${payable.paid_amount?.toFixed(2)}</p>
                <p><strong>Payment Method:</strong> {payable.payment_method}</p>
                {payable.payment_date && (
                  <p><strong>Payment Date:</strong> {new Date(payable.payment_date).toLocaleDateString()}</p>
                )}
                {payable.notes && <p><strong>Notes:</strong> {payable.notes}</p>}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {payable?.status === 'paid' ? 'Close' : 'Cancel'}
          </Button>
          {payable?.status !== 'paid' && (
            <Button 
              onClick={handleMarkAsPaid} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};