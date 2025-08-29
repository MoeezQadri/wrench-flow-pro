import React, { useState, useMemo } from 'react';
import { Invoice, Customer } from '@/types';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useDataContext } from '@/context/data/DataContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, SortAsc, SortDesc, Plus } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/utils/permissions';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { calculateInvoiceBreakdown } from '@/utils/invoice-calculations';
import { PageWrapper } from '@/components/PageWrapper';

const Invoices: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
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

  // Use standardized calculation function for consistency
  const calculateInvoiceTotal = (invoice: Invoice): number => {
    return calculateInvoiceBreakdown(invoice).total;
  };

  const getCustomerName = (customerId: string): string => {
    const customer = contextCustomers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  // Filter and sort invoices
  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = contextInvoices.filter(invoice => {
      const customerName = getCustomerName(invoice.customer_id);
      const invoiceId = invoice.id.substring(0, 8);
      
      // Search filter
      const matchesSearch = searchTerm === '' || 
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoiceId.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      
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
  }, [contextInvoices, contextCustomers, searchTerm, statusFilter, sortBy, sortOrder]);

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
      title="Invoices"
      subtitle="Manage customer invoices"
      loadData={loadData}
      headerActions={
        userCanManageInvoices && (
          <Button asChild>
            <Link to="/invoices/new">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
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
            placeholder="Search invoices or customers..."
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
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
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
            No customers found. Please add customers before creating invoices.
          </p>
          <Link to="/customers" className="text-primary hover:underline mt-2 inline-block">
            Go to Customers page
          </Link>
        </div>
      )}

      {/* Results Summary */}
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {filteredAndSortedInvoices.length} of {contextInvoices.length} invoices
      </div>

      {filteredAndSortedInvoices.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {contextInvoices.length === 0 
            ? "No invoices found. Create a new invoice to get started."
            : "No invoices match your search criteria."
          }
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-card">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Invoice #</th>
                <th className="py-2 px-4 border-b text-left">Customer</th>
                <th className="py-2 px-4 border-b text-left">Date</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Amount</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedInvoices.map(invoice => {
                // Calculate final total for display
                const finalTotal = calculateInvoiceTotal(invoice);
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
                      {invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded text-xs ${
                        invoice.status === 'paid' ? 'bg-success/10 text-success' :
                        invoice.status === 'partial' ? 'bg-warning/10 text-warning' :
                        'bg-destructive/10 text-destructive'
                      }`}>
                        {invoice.status}
                      </span>
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
                        {userCanEditInvoices && invoice.status !== 'paid' && invoice.status !== 'completed' && (
                          <Link
                            to={`/invoices/${invoice.id}/edit`}
                            className="text-success hover:text-success/80 underline"
                          >
                            Edit
                          </Link>
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
    </PageWrapper>
  );
};

export default Invoices;