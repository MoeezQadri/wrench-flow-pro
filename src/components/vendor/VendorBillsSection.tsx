import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Payable, Vendor } from '@/types';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { formatOrgDate, orgToday, toOrgDateInputValue } from '@/utils/datetime';
import { PayableDialog } from '@/components/payable/PayableDialog';
import { PayVendorDialog } from './PayVendorDialog';
import { useDataContext } from '@/context/data/DataContext';

interface VendorBillsSectionProps {
  vendor: Vendor;
  bills: Payable[];
  onRefresh?: () => void | Promise<void>;
}

const outstandingOf = (p: Payable) => Math.max(0, (p.amount || 0) - (p.paid_amount || 0));

/**
 * Shows what is owed to a vendor and which bills that money sits on, so a
 * partial payment can always be tied to a specific bill.
 */
export const VendorBillsSection: React.FC<VendorBillsSectionProps> = ({ vendor, bills, onRefresh }) => {
  const { formatCurrency } = useOrganizationSettings();
  const { markPayableAsPaid } = useDataContext();
  const [selectedBill, setSelectedBill] = useState<Payable | undefined>();
  const [isBillDialogOpen, setIsBillDialogOpen] = useState(false);
  const [isPayVendorOpen, setIsPayVendorOpen] = useState(false);

  const openBills = bills.filter(b => b.status !== 'cancelled' && outstandingOf(b) > 0.005);
  const totalOwed = openBills.reduce((sum, b) => sum + outstandingOf(b), 0);

  const statusOf = (bill: Payable) => {
    const outstanding = outstandingOf(bill);
    if (outstanding <= 0.005) return { label: 'Paid', variant: 'secondary' as const };
    if ((bill.paid_amount || 0) > 0) return { label: 'Partly paid', variant: 'outline' as const };
    if (bill.due_date && toOrgDateInputValue(bill.due_date) < orgToday()) {
      return { label: 'Overdue', variant: 'destructive' as const };
    }
    return { label: 'Unpaid', variant: 'outline' as const };
  };

  const handleRecordPayment = async (id: string, paymentData: {
    amount: number;
    payment_method: string;
    payment_date?: string;
    notes?: string;
  }) => {
    await markPayableAsPaid(id, paymentData);
    setIsBillDialogOpen(false);
    setSelectedBill(undefined);
    await onRefresh?.();
  };

  return (
    <div className="mt-3 border-t pt-3 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Amount owed</p>
          <p className="text-lg font-semibold text-red-600">{formatCurrency(totalOwed)}</p>
        </div>
        {openBills.length > 0 && (
          <Button size="sm" onClick={() => setIsPayVendorOpen(true)}>
            Pay vendor
          </Button>
        )}
      </div>

      {bills.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bills recorded for this vendor.</p>
      ) : (
        <div className="space-y-2">
          {bills.slice(0, 25).map((bill) => {
            const status = statusOf(bill);
            return (
              <div
                key={bill.id}
                className="flex items-center justify-between gap-3 p-2 rounded-md border hover:bg-muted/50 cursor-pointer"
                onClick={() => {
                  setSelectedBill(bill);
                  setIsBillDialogOpen(true);
                }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{bill.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {bill.due_date ? `Due ${formatOrgDate(bill.due_date)}` : 'No due date'}
                    {(bill.paid_amount || 0) > 0 && ` · ${formatCurrency(bill.paid_amount || 0)} paid`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(bill.amount || 0)}</p>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PayableDialog
        open={isBillDialogOpen}
        onOpenChange={setIsBillDialogOpen}
        payable={selectedBill}
        onMarkAsPaid={handleRecordPayment}
      />

      <PayVendorDialog
        open={isPayVendorOpen}
        onOpenChange={setIsPayVendorOpen}
        vendor={vendor}
        bills={bills}
        onPaid={onRefresh}
      />
    </div>
  );
};

export default VendorBillsSection;
