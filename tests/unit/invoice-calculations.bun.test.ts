import { describe, expect, test } from 'bun:test';
import { calculateInvoiceBreakdown } from '../../src/utils/invoice-calculations';

describe('advance on a work order with no lines', () => {
  test('the advance counts as paid but is not revenue', () => {
    const b = calculateInvoiceBreakdown({
      id: 'x',
      status: 'approved',
      items: [],
      payments: [{ id: 'p1', amount: 5000 }],
    } as any);
    expect(b.total).toBe(0);
    expect(b.paidAmount).toBe(5000);
    expect(b.revenueExTax).toBe(0);
    expect(b.overpaymentIncome).toBe(0);
  });
});
