
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Invoice, Customer } from '@/types';
import { resolvePromiseAndSetState } from '@/utils/async-helpers';
import { useAsyncCache } from '@/hooks/useAsyncData';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

// Function to get invoices from Supabase
const getInvoices = async (): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)');
  
  if (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
  
  return data || [];
};

// Function to get customer by ID from Supabase
const getCustomerById = async (id: string): Promise<Customer> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching customer:', error);
    throw error;
  }
  
  return data as Customer;
};

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [getCustomer, customerCache] = useAsyncCache<Customer>(getCustomerById);

  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true);
      try {
        const fetchedInvoices = await getInvoices();
        setInvoices(fetchedInvoices);
      } catch (error) {
        console.error('Error loading invoices:', error);
        toast.error('Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };
    
    loadInvoices();
  }, []);

  // Calculate invoice totals and handle customer data
  const calculateInvoiceTotal = (invoice: Invoice): number => {
    if (!invoice.items) return 0;
    
    // Calculate subtotal
    const subtotal = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Calculate tax amount
    const taxAmount = subtotal * (invoice.taxRate / 100);
    
    // Calculate discount if applicable
    let discountAmount = 0;
    if (invoice.discount) {
      if (invoice.discount.type === 'percentage') {
        discountAmount = subtotal * (invoice.discount.value / 100);
      } else {
        discountAmount = invoice.discount.value;
      }
    }
    
    // Calculate final total
    return subtotal + taxAmount - discountAmount;
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
      
      {invoices.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No invoices found. Create a new invoice to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">ID</th>
                <th className="py-2 px-4 border-b">Customer</th>
                <th className="py-2 px-4 border-b">Date</th>
                <th className="py-2 px-4 border-b">Status</th>
                <th className="py-2 px-4 border-b">Amount</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(invoice => {
                // Calculate final total for display
                const finalTotal = calculateInvoiceTotal(invoice);
                
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">
                      <Link to={`/invoices/${invoice.id}`} className="text-blue-600 hover:underline">
                        {invoice.id.substring(0, 8)}
                      </Link>
                    </td>
                    <td className="py-2 px-4 border-b">
                      {invoice.customerId && customerCache[invoice.customerId] ? (
                        customerCache[invoice.customerId].name
                      ) : (
                        <span className="text-gray-400">Loading...</span>
                      )}
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
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </Link>
                        <Link 
                          to={`/invoices/${invoice.id}/edit`} 
                          className="text-green-600 hover:text-green-800"
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
