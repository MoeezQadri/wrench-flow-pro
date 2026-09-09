import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Payable } from '@/types';
import { useDataContext } from '@/context/data/DataContext';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';

interface BillPartDetailsProps {
  bill: Payable;
  className?: string;
}

/**
 * Shows the part a bill was raised for, so a payment is never ambiguous, and
 * marks the part as paid for once the bill is settled.
 */
export const BillPartDetails: React.FC<BillPartDetailsProps> = ({ bill, className }) => {
  const { parts } = useDataContext();
  const { formatCurrency } = useOrganizationSettings();

  const billAny = bill as Payable & { part_id?: string; quantity?: number; unit_cost?: number };
  if (!billAny.part_id) return null;

  const part = parts.find(p => p.id === billAny.part_id);
  const name = part?.name || 'Part';
  const quantity = billAny.quantity;
  const unitCost = billAny.unit_cost;
  const fullyPaid = (bill.amount || 0) - (bill.paid_amount || 0) <= 0.005;

  return (
    <div className={`text-xs text-muted-foreground flex flex-wrap items-center gap-2 ${className || ''}`}>
      <span>
        Parts: {name}
        {quantity ? ` × ${quantity}` : ''}
        {unitCost !== undefined && unitCost !== null ? ` at ${formatCurrency(unitCost)} each` : ''}
      </span>
      {fullyPaid && (
        <Badge variant="secondary" className="text-xs">
          Parts paid for
        </Badge>
      )}
    </div>
  );
};

export default BillPartDetails;
