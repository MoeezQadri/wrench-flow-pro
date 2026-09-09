import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Payable, Vendor } from '@/types';
import { toast } from 'sonner';
import { useDataContext } from '@/context/data/DataContext';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { formatOrgDate, orgToday, toOrgDayStart } from '@/utils/datetime';
import BillPartDetails from './BillPartDetails';

interface PayVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: Vendor;
  bills: Payable[];
  onPaid?: () => void | Promise<void>;
}

const outstandingOf = (p: Payable) => Math.max(0, (p.amount || 0) - (p.paid_amount || 0));

/**
 * Lets the workshop pay a vendor once and split that payment across the
 * vendor's open bills. Allocation is pre-filled oldest bill first and each
 * amount stays editable, so a partial payment is never ambiguous.
 */
export const PayVendorDialog: React.FC<PayVendorDialogProps> = ({
  open,
  onOpenChange,
  vendor,
  bills,
  onPaid,
}) => {
  const { markPayableAsPaid } = useDataContext();
  const { formatCurrency, getCurrencySymbol } = useOrganizationSettings();

  const openBills = useMemo(
    () =>
      bills
        .filter(b => b.status !== 'cancelled' && outstandingOf(b) > 0.005)
        .sort((a, b) => String(a.due_date || a.created_at || '').localeCompare(String(b.due_date || b.created_at || ''))),
    [bills]
  );

  const totalOutstanding = openBills.reduce((sum, b) => sum + outstandingOf(b), 0);

  const [paymentTotal, setPaymentTotal] = useState(totalOutstanding);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDate, setPaymentDate] = useState(orgToday());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Spread an amount across bills, oldest first
  const allocateOldestFirst = (amount: number) => {
    let left = Math.max(0, amount);
    const next: Record<string, number> = {};
    openBills.forEach((bill) => {
      const take = Math.min(outstandingOf(bill), left);
      next[bill.id] = Math.round(take * 100) / 100;
      left -= take;
    });
    return next;
  };

  useEffect(() => {
    if (open) {
      setPaymentTotal(totalOutstanding);
      setAllocations(allocateOldestFirst(totalOutstanding));
      setPaymentMethod('');
      setPaymentDate(orgToday());
      setNotes('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vendor.id, totalOutstanding]);

  const handleTotalChange = (value: number) => {
    setPaymentTotal(value);
    setAllocations(allocateOldestFirst(value));
  };

  const allocatedTotal = Object.values(allocations).reduce((sum, v) => sum + (v || 0), 0);

  const handleSubmit = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }
    const entries = Object.entries(allocations).filter(([, amount]) => (amount || 0) > 0.005);
    if (entries.length === 0) {
      toast.error('Enter how much to pay against at least one bill');
      return;
    }
    for (const [billId, amount] of entries) {
      const bill = openBills.find(b => b.id === billId);
      if (bill && amount > outstandingOf(bill) + 0.005) {
        toast.error(`${bill.description}: cannot pay more than ${formatCurrency(outstandingOf(bill))}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      for (const [billId, amount] of entries) {
        await markPayableAsPaid(billId, {
          amount,
          payment_method: paymentMethod,
          payment_date: toOrgDayStart(paymentDate),
          notes: notes || undefined,
        });
      }
      toast.success(`Payment of ${formatCurrency(allocatedTotal)} recorded for ${vendor.name}`);
      await onPaid?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error recording vendor payment:', error);
      toast.error('Failed to record the vendor payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pay {vendor.name}</DialogTitle>
          <DialogDescription>
            Total owed: {formatCurrency(totalOutstanding)} across {openBills.length} bill{openBills.length !== 1 ? 's' : ''}.
            Amounts are filled oldest bill first and can be edited.
          </DialogDescription>
        </DialogHeader>

        {openBills.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">Nothing is owed to this vendor.</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendorPaymentTotal">Payment Amount ({getCurrencySymbol()})</Label>
              <Input
                id="vendorPaymentTotal"
                type="number"
                step="0.01"
                value={paymentTotal}
                onChange={(e) => handleTotalChange(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label>Applied to bills</Label>
              <div className="space-y-2">
                {openBills.map((bill) => (
                  <div key={bill.id} className="flex items-center gap-3 p-3 border rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{bill.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {bill.due_date ? `Due ${formatOrgDate(bill.due_date)}` : 'No due date'} ·
                        {' '}Outstanding {formatCurrency(outstandingOf(bill))}
                      </p>
                      <BillPartDetails bill={bill} />
                    </div>
                    <Input
                      className="w-32"
                      type="number"
                      step="0.01"
                      min="0"
                      max={outstandingOf(bill)}
                      value={allocations[bill.id] ?? 0}
                      onChange={(e) =>
                        setAllocations(prev => ({ ...prev, [bill.id]: parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Allocated: {formatCurrency(allocatedTotal)}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendorPaymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="vendorPaymentMethod">
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
                <Label htmlFor="vendorPaymentDate">Payment Date</Label>
                <Input
                  id="vendorPaymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorPaymentNotes">Notes (Optional)</Label>
              <Textarea
                id="vendorPaymentNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reference number, cheque number..."
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          {openBills.length > 0 && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PayVendorDialog;
