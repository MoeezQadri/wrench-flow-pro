
import { InvoiceStatus } from '@/types';

interface StatusBadgeProps {
  status: InvoiceStatus;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <span className={`status-badge status-${status}`}>
      {status === 'open' ? 'Open' : 
       status === 'in-progress' ? 'In Progress' : 
       status === 'completed' ? 'Completed' : 'Paid'}
    </span>
  );
};

export default StatusBadge;
