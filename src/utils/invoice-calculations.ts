import type { Invoice, InvoiceItem } from '@/types';
import { isNonBillable } from '@/utils/invoice-status';
import { orgToday, toOrgDateInputValue } from '@/utils/datetime';


export interface InvoiceCalculationBreakdown {
  subtotal: number;
  discountAmount: number;
  discountType: 'none' | 'percentage' | 'fixed';
  discountValue: number;
  afterDiscount: number;
  /** Revenue earned, tax excluded. Tax collected is never income. */
  revenueExTax: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  partsCost: number;
  /** Part lines with no cost snapshot, so cost of parts sold is incomplete */
  partLinesMissingCost: number;
  grossProfit: number;
  grossMargin: number;
}


/**
 * Calculate comprehensive invoice breakdown including all components
 */
export const calculateInvoiceBreakdown = (invoice: Invoice): InvoiceCalculationBreakdown => {
  if (!invoice.items || invoice.items.length === 0) {
    return {
      subtotal: 0,
      discountAmount: 0,
      discountType: 'none',
      discountValue: 0,
      afterDiscount: 0,
      revenueExTax: 0,
      taxAmount: 0,
      taxRate: invoice.tax_rate || 0,
      total: 0,
      paidAmount: 0,
      balanceDue: 0,
      partsCost: 0,
      partLinesMissingCost: 0,
      grossProfit: 0,
      grossMargin: 0
    };
  }

  // Revenue uses selling prices; parts cost uses the historical invoice-line snapshot.
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const partsCost = invoice.items.reduce(
    (sum, item) => sum + (item.type === 'part' ? item.quantity * (item.cost || 0) : 0),
    0
  );
  // Old part lines saved before cost tracking have no cost snapshot; never guess one.
  const partLinesMissingCost = invoice.items.filter(
    item => item.type === 'part' && !(item.cost && item.cost > 0)
  ).length;

  // Apply discounts
  let discountAmount = 0;
  const discountType = invoice.discount_type || 'none';
  const discountValue = invoice.discount_value || 0;
  
  if (discountType === 'percentage' && discountValue) {
    discountAmount = subtotal * (discountValue / 100);
  } else if (discountType === 'fixed' && discountValue) {
    discountAmount = discountValue;
  }

  const afterDiscount = subtotal - discountAmount;

  // Apply tax on discounted amount
  const taxRate = invoice.tax_rate || 0;
  const taxAmount = afterDiscount * (taxRate / 100);

  const total = afterDiscount + taxAmount;

  // Calculate actual paid amount from payments array
  const paidAmount = invoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
  const balanceDue = total - paidAmount;
  const revenueExTax = afterDiscount;
  const grossProfit = revenueExTax - partsCost;
  const grossMargin = revenueExTax > 0 ? (grossProfit / revenueExTax) * 100 : 0;

  return {
    subtotal,
    discountAmount,
    discountType,
    discountValue,
    afterDiscount,
    revenueExTax,
    taxAmount,
    taxRate,
    total,
    paidAmount,
    balanceDue,
    partsCost,
    partLinesMissingCost,
    grossProfit,
    grossMargin
  };
};

/** True when an expense is a part/inventory purchase or an invoice cost, i.e. not overhead */
export const isInventoryOrJobCostExpense = (expense: {
  category?: string | null;
  invoice_id?: string | null;
}): boolean => {
  const category = (expense.category || '').toLowerCase();
  return category === 'parts' || !!expense.invoice_id;
};

export interface ProfitAndLoss {
  revenueExTax: number;
  taxCollected: number;
  partsCost: number;
  partLinesMissingCost: number;
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: number;
  netProfit: number;
  netMargin: number;
}

/**
 * Profit and loss for a period: revenue before tax, less cost of parts sold,
 * less overhead. Part purchases are inventory, so they are excluded from
 * overhead and only counted through cost of parts sold.
 */
export const calculateProfitAndLoss = (
  billableInvoices: Invoice[],
  expenses: Array<{ amount: number; category?: string | null; invoice_id?: string | null }>
): ProfitAndLoss => {
  const totals = billableInvoices.reduce(
    (acc, invoice) => {
      const breakdown = calculateInvoiceBreakdown(invoice);
      return {
        revenueExTax: acc.revenueExTax + breakdown.revenueExTax,
        taxCollected: acc.taxCollected + breakdown.taxAmount,
        partsCost: acc.partsCost + breakdown.partsCost,
        partLinesMissingCost: acc.partLinesMissingCost + breakdown.partLinesMissingCost
      };
    },
    { revenueExTax: 0, taxCollected: 0, partsCost: 0, partLinesMissingCost: 0 }
  );

  const operatingExpenses = expenses
    .filter(expense => !isInventoryOrJobCostExpense(expense))
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const grossProfit = totals.revenueExTax - totals.partsCost;
  const netProfit = grossProfit - operatingExpenses;

  return {
    ...totals,
    grossProfit,
    grossMargin: totals.revenueExTax > 0 ? (grossProfit / totals.revenueExTax) * 100 : 0,
    operatingExpenses,
    netProfit,
    netMargin: totals.revenueExTax > 0 ? (netProfit / totals.revenueExTax) * 100 : 0
  };
};


/**
 * Calculate the total amount for an invoice including items, tax, and discounts
 * @deprecated Use calculateInvoiceBreakdown for detailed breakdown or calculateInvoiceTotal for simple total
 */
export const calculateInvoiceTotal = (invoice: Invoice): number => {
  return calculateInvoiceBreakdown(invoice).total;
};

/**
 * Outstanding balance for a single invoice (total minus recorded payments).
 * Never negative, so overpayments cannot reduce other receivables.
 */
export const calculateBalanceDue = (invoice: Invoice): number => {
  return Math.max(0, calculateInvoiceBreakdown(invoice).balanceDue);
};

/**
 * Invoices that still owe money (billable, not fully paid)
 */
export const getReceivableInvoices = (invoices: Invoice[]): Invoice[] => {
  return invoices.filter(
    invoice =>
      invoice.status !== 'paid' &&
      !isNonBillable(invoice.status) &&
      calculateBalanceDue(invoice) > 0
  );
};

/**
 * Calculate total receivables from a list of invoices (outstanding balances)
 */
export const calculateTotalReceivables = (invoices: Invoice[]): number => {
  return getReceivableInvoices(invoices).reduce(
    (total, invoice) => total + calculateBalanceDue(invoice),
    0
  );
};

/**
 * Calculate overdue receivables (outstanding balance past the due date)
 */
export const calculateOverdueAmount = (invoices: Invoice[]): number => {
  const today = orgToday();
  return getReceivableInvoices(invoices)
    .filter(invoice => invoice.due_date && toOrgDateInputValue(invoice.due_date) < today)
    .reduce((total, invoice) => total + calculateBalanceDue(invoice), 0);
};


/**
 * Enhanced calculation function for data-service.ts compatibility
 * Returns detailed breakdown in the format expected by existing components
 */
export const calculateInvoiceTotalWithBreakdown = (invoice: Invoice): { 
  subtotal: number; 
  tax: number; 
  total: number; 
  paidAmount: number; 
  balanceDue: number 
} => {
  const breakdown = calculateInvoiceBreakdown(invoice);
  return {
    subtotal: breakdown.subtotal,
    tax: breakdown.taxAmount,
    total: breakdown.total,
    paidAmount: breakdown.paidAmount,
    balanceDue: breakdown.balanceDue
  };
};