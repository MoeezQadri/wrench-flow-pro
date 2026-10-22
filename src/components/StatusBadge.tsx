import type { InvoiceStatus } from '@/types';
import { statusLabel } from '@/utils/invoice-status';

interface StatusBadgeProps {
  status: InvoiceStatus;
}

const STYLES: Record<string, string> = {
  approved: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  work_in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  work_completed: 'bg-teal-100 text-teal-800 border-teal-200',
  payment_pending: 'bg-green-100 text-green-800 border-green-200',
  partial_payment: 'bg-orange-100 text-orange-800 border-orange-200',
  payment_completed: 'bg-purple-100 text-purple-800 border-purple-200',
  estimate: 'bg-slate-100 text-slate-800 border-slate-200',
  declined: 'bg-red-100 text-red-800 border-red-200',
};

const StatusBadge = ({ status }: StatusBadgeProps) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STYLES[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
  >
    {statusLabel(status)}
  </span>
);

export default StatusBadge;
