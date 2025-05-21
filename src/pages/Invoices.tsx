import React, { useState, useEffect } from 'react';
import { getInvoices, getCustomerById } from '@/services/data-service';
import { Invoice, Customer } from '@/types';
import { resolvePromiseAndSetState } from '@/utils/async-helpers';
import { useAsyncData } from '@/hooks/useAsyncData';

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [customerData, setCustomerData] = useState<Record<string, Customer>>({});

  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true);
      await resolvePromiseAndSetState(getInvoices(), setInvoices);
      setLoading(false);
    };
    
    loadInvoices();
  }, []);

  useEffect(() => {
    const loadCustomers = async () => {
      const customerIds = invoices.map(invoice => invoice.customerId);
      const uniqueIds = [...new Set(customerIds)];
      
      for (const id of uniqueIds) {
        if (!customerData[id]) {
          const customer = await getCustomerById(id);
          setCustomerData(prev => ({
            ...prev,
            [id]: customer
          }));
        }
      }
    };
    
    if (invoices.length > 0) {
      loadCustomers();
    }
  }, [invoices, customerData]);

  // Create a customer cache to store resolved customers
  const getCustomerWithCache = async (customerId: string): Promise<Customer> => {
    if (customerData[customerId]) {
      return customerData[customerId];
    }
    
    const customer = await getCustomerById(customerId);
    setCustomerData(prev => ({
      ...prev,
      [customerId]: customer
    }));
    return customer;
  };

  if (loading) {
    return <div>Loading invoices...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Invoices</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">ID</th>
            <th className="py-2 px-4 border-b">Customer</th>
            <th className="py-2 px-4 border-b">Date</th>
            <th className="py-2 px-4 border-b">Status</th>
            <th className="py-2 px-4 border-b">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(invoice => {
            // Calculate total amount
            const subtotal = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const taxAmount = subtotal * (invoice.taxRate / 100);
            const total = subtotal + taxAmount;
            
            // Calculate discount if applicable
            let discountAmount = 0;
            if (invoice.discount) {
              if (invoice.discount.type === 'percentage') {
                discountAmount = subtotal * (invoice.discount.value / 100);
              } else {
                discountAmount = invoice.discount.value;
              }
            }
            
            const finalTotal = total - discountAmount;
            
            return (
              <tr key={invoice.id}>
                <td className="py-2 px-4 border-b">{invoice.id}</td>
                <td className="py-2 px-4 border-b">
                  {customerData[invoice.customerId]?.name || 'Loading...'}
                </td>
                <td className="py-2 px-4 border-b">
                  {new Date(invoice.date).toLocaleDateString()}
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Invoices;
