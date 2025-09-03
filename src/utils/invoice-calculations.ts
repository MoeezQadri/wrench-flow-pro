import type { Invoice, InvoiceItem } from '@/types';

export interface InvoiceCalculationBreakdown {
  subtotal: number;
  discountAmount: number;
  discountType: 'none' | 'percentage' | 'fixed';
  discountValue: number;
  afterDiscount: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
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
      taxAmount: 0,
      taxRate: invoice.tax_rate || 0,
      total: 0,
      paidAmount: 0,
      balanceDue: 0
    };
  }

  // Calculate subtotal from all items
  const subtotal = invoice.items.reduce((sum, item) => {
    return sum + (item.quantity * item.price);
  }, 0);

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

  return {
    subtotal,
    discountAmount,
    discountType,
    discountValue,
    afterDiscount,
    taxAmount,
    taxRate,
    total,
    paidAmount,
    balanceDue
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
 * Calculate total receivables from a list of invoices
 */
export const calculateTotalReceivables = (invoices: Invoice[]): number => {
  return invoices
    .filter(invoice => invoice.status !== 'paid')
    .reduce((total, invoice) => total + calculateInvoiceBreakdown(invoice).total, 0);
};

/**
 * Calculate overdue amount from a list of invoices
 */
export const calculateOverdueAmount = (invoices: Invoice[]): number => {
  return invoices
    .filter(invoice => {
      if (invoice.status === 'paid' || !invoice.due_date) return false;
      return new Date(invoice.due_date) < new Date();
    })
    .reduce((total, invoice) => total + calculateInvoiceBreakdown(invoice).total, 0);
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