import type { InvoiceStatus } from '@/types';

/**
 * Statuses that represent a quote rather than money owed.
 * These must never be counted as revenue, receivables or overdue.
 */
export const NON_BILLABLE_STATUSES: InvoiceStatus[] = ['estimate', 'declined'];

export const isEstimate = (status?: string | null): boolean =>
  status === 'estimate';

export const isDeclined = (status?: string | null): boolean =>
  status === 'declined';

/** True for estimates and declined quotes (excluded from all financial totals). */
export const isNonBillable = (status?: string | null): boolean =>
  status === 'estimate' || status === 'declined';

/** True for real invoices that should count towards financial totals. */
export const isBillable = (status?: string | null): boolean =>
  !isNonBillable(status);

/** Filter helper: keep only real invoices. */
export const billableInvoices = <T extends { status?: string | null }>(
  invoices: T[]
): T[] => invoices.filter((invoice) => isBillable(invoice.status));
