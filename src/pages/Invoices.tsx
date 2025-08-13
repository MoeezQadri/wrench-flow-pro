
import React, { useState, useEffect, useMemo } from 'react';
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

const Invoices: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Add error boundary for context
  let contextData;
  try {
    contextData = useDataContext();
  } catch (error) {
    console.error('Failed to get data context:', error);
    return (
      <div className="p-4 text-center">
        <div className="text-red-600">
          Failed to load data context. Please refresh the page.
        </div>
      </div>
    );
  }

  const { 
    invoices: contextInvoices, 
    customers: contextCustomers,
    loadInvoices,
    loadCustomers
  } = contextData;
  const { currentUser } = useAuthContext();
  const { formatCurrency } = useOrganizationSettings();
  
  // Check permissions
  const userCanManageInvoices = hasPermission(currentUser, 'invoices', 'manage') || hasPermission(currentUser, 'invoices', 'create');
  const userCanEditInvoices = hasPermission(currentUser, 'invoices', 'edit');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        console.log('Loading invoices and customers...');
        // Ensure invoices and customers are loaded
        await Promise.all([
          loadInvoices(),
          loadCustomers()
        ]);
        
        console.log("Invoice page data loaded:", {
          invoicesCount: contextInvoices.length,
          customersCount: contextCustomers.length
        });
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []); // Remove function dependencies to prevent infinite loop

  const calculateInvoiceTotal = (invoice: Invoice): number => {
    if (!invoice.items) return 0;

    // Calculate subtotal
    const subtotal = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Calculate tax amount
    const taxAmount = subtotal * (invoice.tax_rate / 100);

    // Calculate discount if applicable
    let discountAmount = 0;
    if (invoice.discount_type && invoice.discount_type !== 'none') {
      if (invoice.discount_type === 'percentage') {
        discountAmount = subtotal * ((invoice.discount_value || 0) / 100);
      } else if (invoice.discount_type === 'fixed') {
        discountAmount = invoice.discount_value || 0;
      }
    }

    // Calculate final total
    return subtotal + taxAmount - discountAmount;
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

  if (loading) {
    return <div className="p-4 text-center">Loading invoices...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Invoices</h1>
        {userCanManageInvoices && (
          <Button asChild>
            <Link to="/invoices/new">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Link>
          </Button>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
        <div className="p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700">
            No customers found. Please add customers before creating invoices.
          </p>
          <Link to="/customers" className="text-blue-600 hover:underline mt-2 inline-block">
            Go to Customers page
          </Link>
        </div>
      )}

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredAndSortedInvoices.length} of {contextInvoices.length} invoices
      </div>

      {filteredAndSortedInvoices.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {contextInvoices.length === 0 
            ? "No invoices found. Create a new invoice to get started."
            : "No invoices match your search criteria."
          }
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
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
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">
                      <Link to={`/invoices/${invoice.id}`} className="text-blue-600 hover:underline">
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
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
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
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          View
                        </Link>
                        {userCanEditInvoices && invoice.status !== 'paid' && invoice.status !== 'completed' && (
                          <Link
                            to={`/invoices/${invoice.id}/edit`}
                            className="text-green-600 hover:text-green-800 underline"
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
    </div>
  );
};

export default Invoices;
