import React, { useState, useMemo } from 'react';
import { Invoice } from '@/types';
import { Link } from 'react-router-dom';
import { useDataContext } from '@/context/data/DataContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, SortAsc, SortDesc, Plus, Trash2 } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/utils/permissions';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useDebounce } from '@/hooks/useDebounce';
import { calculateInvoiceBreakdown } from '@/utils/invoice-calculations';
import { PageWrapper } from '@/components/PageWrapper';
import { formatOrgDate } from '@/utils/datetime';
import StatusBadge from '@/components/StatusBadge';
import DeleteInvoiceDialog from '@/components/invoice/DeleteInvoiceDialog';
import { stageOf, canDeleteStage, canReopen } from '@/utils/invoice-status';


interface InvoicesProps {
  view?: 'work_orders' | 'invoices';
}

const Invoices: React.FC<InvoicesProps> = ({ view = 'invoices' }) => {
  const isWorkOrders = view === 'work_orders';
  const noun = isWorkOrders ? 'work orders' : 'invoices';
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 250);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const { 
    invoices: contextInvoices, 
    customers: contextCustomers,
    loadInvoices,
    loadCustomers
  } = useDataContext();
  
  const { currentUser } = useAuthContext();
  const { formatCurrency } = useOrganizationSettings();
  
  // Check permissions
  const userCanManageInvoices = hasPermission(currentUser, 'invoices', 'manage') || hasPermission(currentUser, 'invoices', 'create');
  const userCanEditInvoices = hasPermission(currentUser, 'invoices', 'edit');
  const userCanDeleteInvoices = hasPermission(currentUser, 'invoices', 'delete');


  // Use standardized calculation function for consistency
  const calculateInvoiceTotal = (invoice: Invoice): number => {
    return calculateInvoiceBreakdown(invoice).total;
  };

  const getCustomerName = (customerId: string): string => {
    const customer = contextCustomers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  // Each list shows only its own stage
  const stageInvoices = useMemo(
    () => contextInvoices.filter(invoice => {
      const stage = stageOf(invoice.status);
      return isWorkOrders ? stage !== 'invoice' : stage === 'invoice';
    }),
    [contextInvoices, isWorkOrders]
  );

  // Reset the filter when switching between the two lists
  React.useEffect(() => { setStatusFilter('all'); }, [view]);

  // Filter and sort invoices
  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = stageInvoices.filter(invoice => {
      const customerName = getCustomerName(invoice.customer_id);
      const invoiceId = invoice.id.substring(0, 8);
      
      // Search filter
      const search = debouncedSearchTerm.trim().toLowerCase();
      const matchesSearch = search === '' || 
        customerName.toLowerCase().includes(search) ||
        invoiceId.toLowerCase().includes(search);
      
      // Status filter
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'overdue'
          ? invoice.status !== 'payment_completed' && !!invoice.due_date && new Date(invoice.due_date) < new Date()
          : invoice.status === statusFilter);
      
      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date || 0);
          bValue = new Date(b.date || 0);
          break;
        case 'customer':
          aValue = getCustomerName(a.customer_id);
          bValue = getCustomerName(b.customer_id);
          break;
        case 'amount':
          aValue = calculateInvoiceTotal(a);
          bValue = calculateInvoiceTotal(b);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.id;
          bValue = b.id;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [stageInvoices, contextCustomers, debouncedSearchTerm, statusFilter, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('date');
    setSortOrder('desc');
  };

  const loadData = async () => {
    await Promise.all([loadInvoices(), loadCustomers()]);
  };

  return (
    <PageWrapper
      title={isWorkOrders ? 'Work Orders' : 'Invoices'}
      subtitle={isWorkOrders ? 'Estimates and jobs in progress' : 'Completed work and payments'}
      loadData={loadData}
      headerActions={
        userCanManageInvoices && isWorkOrders && (
          <Button asChild>
            <Link to="/work-orders/new">
              <Plus className="h-4 w-4 mr-2" />
              New Work Order
            </Link>
          </Button>
        )
      }
    >
      {/* Search and Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${noun} or customers...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
             <SelectItem value="all">All Statuses</SelectItem>
             {isWorkOrders ? (
               <>
                 <SelectItem value="estimate">Estimates</SelectItem>
                 <SelectItem value="approved">Approved</SelectItem>
                 <SelectItem value="work_in_progress">Work in progress</SelectItem>
                 <SelectItem value="work_completed">Work completed</SelectItem>
                 <SelectItem value="declined">Declined</SelectItem>
               </>
             ) : (
               <>
                 <SelectItem value="payment_pending">Payment pending</SelectItem>
                 <SelectItem value="partial_payment">Partial payment</SelectItem>
                 <SelectItem value="payment_completed">Payment completed</SelectItem>
                 <SelectItem value="overdue">Overdue</SelectItem>
               </>
             )}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="amount">Amount</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleSortOrder} className="flex-1">
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </div>

      {contextCustomers.length === 0 && (
        <div className="p-4 mb-4 bg-warning/10 border border-warning/20 rounded-md">
          <p className="text-warning-foreground">
            No customers found. Please add customers before creating work orders.
          </p>
          <Link to="/customers" className="text-primary hover:underline mt-2 inline-block">
            Go to Customers page
          </Link>
        </div>
      )}

      {/* Results Summary */}
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {filteredAndSortedInvoices.length} of {stageInvoices.length} {noun}
      </div>

      {filteredAndSortedInvoices.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {stageInvoices.length === 0
            ? (isWorkOrders ? 'No work orders found. Create a new work order to get started.' : 'No invoices yet. Work orders appear here once they are completed.')
            : `No ${noun} match your search criteria.`
          }
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-card">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">{isWorkOrders ? 'Work Order #' : 'Invoice #'}</th>
                <th className="py-2 px-4 border-b text-left">Customer</th>
                <th className="py-2 px-4 border-b text-left">Date</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Amount</th>
                <th className="py-2 px-4 border-b text-left">{isWorkOrders ? 'Advance received' : 'Paid'}</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedInvoices.map(invoice => {
                // Calculate final total for display
                const breakdown = calculateInvoiceBreakdown(invoice);
                const finalTotal = breakdown.total;
                const paid = breakdown.paidAmount;
                const customerName = getCustomerName(invoice.customer_id);

                return (
                  <tr key={invoice.id} className="hover:bg-muted/50">
                    <td className="py-2 px-4 border-b">
                      <Link to={`/invoices/${invoice.id}`} className="text-primary hover:underline">
                        #{invoice.id.substring(0, 8)}
                      </Link>
                    </td>
                    <td className="py-2 px-4 border-b">
                      {customerName}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {formatOrgDate(invoice.date)}
                    </td>
                    <td className="py-2 px-4 border-b">
                       <StatusBadge status={invoice.status} />
                    </td>
                    <td className="py-2 px-4 border-b">
                      {formatCurrency(finalTotal)}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <div className="flex space-x-2">
                        <Link
                          to={`/invoices/${invoice.id}`}
                          className="text-primary hover:text-primary/80 underline"
                        >
                          View
                        </Link>
                        {userCanEditInvoices && invoice.status !== 'payment_completed' && invoice.status !== 'declined' && (
                          <Link
                            to={`/invoices/${invoice.id}/edit`}
                            className="text-success hover:text-success/80 underline"
                          >
                            Edit
                          </Link>
                        )}
                        {userCanEditInvoices && invoice.status === 'payment_completed' && (
                          canReopen(currentUser?.role) ? (
                            <Link to={`/invoices/${invoice.id}/edit`} className="text-success hover:text-success/80 underline">
                              Reopen
                            </Link>
                          ) : (
                            <span className="text-muted-foreground" title="Fully paid invoices are view only. An owner or admin can reopen them.">
                              Payment completed — view only
                            </span>
                          )
                        )}
                        {userCanDeleteInvoices && canDeleteStage(invoice.status) && (
                          <button
                            type="button"
                            onClick={() => setInvoiceToDelete(invoice)}
                            className="text-destructive hover:text-destructive/80 underline inline-flex items-center gap-1"
                            aria-label={`Delete invoice ${invoice.id.substring(0, 8)}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <DeleteInvoiceDialog
        invoice={invoiceToDelete}
        open={!!invoiceToDelete}
        onOpenChange={(open) => !open && setInvoiceToDelete(null)}
        customerName={invoiceToDelete ? getCustomerName(invoiceToDelete.customer_id) : ''}
        formattedTotal={invoiceToDelete ? formatCurrency(calculateInvoiceTotal(invoiceToDelete)) : ''}
      />
    </PageWrapper>

  );
};

export default Invoices;