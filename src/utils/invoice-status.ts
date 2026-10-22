import type { InvoiceStatus } from '@/types';

/**
 * Lifecycle: Estimate -> Work Order (approved, work_in_progress)
 * -> Invoice (payment_pending, partial_payment, payment_completed).
 * "Completed" work is stored as payment_pending.
 */
export const WORK_ORDER_STATUSES: InvoiceStatus[] = ['approved', 'work_in_progress', 'work_completed'];
export const INVOICE_STATUSES: InvoiceStatus[] = ['payment_pending', 'partial_payment', 'payment_completed'];
export const ESTIMATE_STATUSES: InvoiceStatus[] = ['estimate', 'declined'];

/** Statuses that represent a quote rather than money owed. */
export const NON_BILLABLE_STATUSES: InvoiceStatus[] = ['estimate', 'declined'];

export const STATUS_LABELS: Record<string, string> = {
  estimate: 'Estimate',
  declined: 'Declined',
  approved: 'Approved',
  work_in_progress: 'Work in progress',
  work_completed: 'Work completed',
  payment_pending: 'Payment pending',
  partial_payment: 'Partial payment',
  payment_completed: 'Payment completed',
  overdue: 'Overdue',
};

export const statusLabel = (status?: string | null): string =>
  (status && STATUS_LABELS[status]) || status || '';

export type InvoiceStage = 'estimate' | 'work_order' | 'invoice';

export const stageOf = (status?: string | null): InvoiceStage => {
  if (status === 'estimate' || status === 'declined') return 'estimate';
  if (isInvoiceStage(status)) return 'invoice';
  return 'work_order';
};

export const stageTitle = (status?: string | null): string => {
  const stage = stageOf(status);
  return stage === 'estimate' ? 'Estimate' : stage === 'invoice' ? 'Invoice' : 'Work Order';
};

/** Work is done: parts, labour, customer and vehicle are locked. */
export const isInvoiceStage = (status?: string | null): boolean =>
  !!status && (INVOICE_STATUSES as string[]).includes(status);

export const isWorkOrder = (status?: string | null): boolean =>
  !!status && (WORK_ORDER_STATUSES as string[]).includes(status);

export const isPaymentCompleted = (status?: string | null): boolean =>
  status === 'payment_completed';

/** Work orders may be saved with no lines (e.g. to take an advance); estimates and invoices may not. */
export const canSaveWithoutItems = (status?: string | null): boolean => isWorkOrder(status);

/** Line items may change only before work is completed. */
export const canEditItems = (status?: string | null): boolean => !isInvoiceStage(status);

/** Payments, discount, tax, notes: everything except fully paid invoices. */
export const canEditMoney = (status?: string | null): boolean => !isPaymentCompleted(status);

/** Only owner/admin may reopen a fully paid invoice. */
export const canReopen = (role?: string | null): boolean =>
  role === 'owner' || role === 'admin';

/** Stages that can be deleted (completed work must be reopened first). */
export const canDeleteStage = (status?: string | null): boolean => !isInvoiceStage(status);

export const isEstimate = (status?: string | null): boolean => status === 'estimate';
export const isDeclined = (status?: string | null): boolean => status === 'declined';

/** True for estimates and declined quotes (excluded from all financial totals). */
export const isNonBillable = (status?: string | null): boolean =>
  status === 'estimate' || status === 'declined';

export const isBillable = (status?: string | null): boolean => !isNonBillable(status);

export const billableInvoices = <T extends { status?: string | null }>(invoices: T[]): T[] =>
  invoices.filter((invoice) => isBillable(invoice.status));
