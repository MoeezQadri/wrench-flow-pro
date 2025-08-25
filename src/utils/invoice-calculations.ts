import type { Invoice, InvoiceItem } from '@/types';

/**
 * Calculate the total amount for an invoice including items, tax, and discounts
 */
export const calculateInvoiceTotal = (invoice: Invoice): number => {
  if (!invoice.items || invoice.items.length === 0) {
    return 0;
  }

  // Calculate subtotal from all items
  const subtotal = invoice.items.reduce((sum, item) => {
    return sum + (item.quantity * item.price);
  }, 0);

  // Apply discounts
  let discountAmount = 0;
  if (invoice.discount_type === 'percentage' && invoice.discount_value) {
    discountAmount = subtotal * (invoice.discount_value / 100);
  } else if (invoice.discount_type === 'fixed' && invoice.discount_value) {
    discountAmount = invoice.discount_value;
  }

  const afterDiscount = subtotal - discountAmount;

  // Apply tax
  const taxAmount = invoice.tax_rate ? afterDiscount * (invoice.tax_rate / 100) : 0;

  return afterDiscount + taxAmount;
};

/**
 * Calculate total receivables from a list of invoices
 */
export const calculateTotalReceivables = (invoices: Invoice[]): number => {
  return invoices
    .filter(invoice => invoice.status !== 'paid')
    .reduce((total, invoice) => total + calculateInvoiceTotal(invoice), 0);
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
    .reduce((total, invoice) => total + calculateInvoiceTotal(invoice), 0);
};