
import React, { useState, useEffect } from 'react';
import { Invoice, Customer } from '@/types';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useDataContext } from '@/context/data/DataContext';

const Invoices: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const { 
    invoices: contextInvoices, 
    customers: contextCustomers,
    loadInvoices,
    loadCustomers
  } = useDataContext();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
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
  }, []); // Remove dependencies to prevent infinite loop

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

  if (loading) {
    return <div className="p-4 text-center">Loading invoices...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Link
          to="/invoices/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          New Invoice
        </Link>
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

      {contextInvoices.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No invoices found. Create a new invoice to get started.
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
              {contextInvoices.map(invoice => {
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
                      ${finalTotal.toFixed(2)}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <div className="flex space-x-2">
                        <Link
                          to={`/invoices/${invoice.id}`}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          View
                        </Link>
                        <Link
                          to={`/invoices/${invoice.id}/edit`}
                          className="text-green-600 hover:text-green-800 underline"
                        >
                          Edit
                        </Link>
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
