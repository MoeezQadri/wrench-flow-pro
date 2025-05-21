
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAsyncCache } from '@/hooks/useAsyncData';
import { supabase } from '@/integrations/supabase/client';
import { getCustomerById } from '@/services/data-service';
import { Customer } from '@/types';

// CustomerCell component to handle async loading of customer data
const CustomerCell = ({ 
  customerId, 
  getCustomer, 
  customerCache 
}: { 
  customerId: string; 
  getCustomer: (id: string) => Promise<Customer>; 
  customerCache: Record<string, Customer> 
}) => {
  const [name, setName] = useState('Loading...');
  
  useEffect(() => {
    const loadCustomer = async () => {
      try {
        // Use the cache if available
        if (customerCache[customerId]) {
          setName(customerCache[customerId].name);
        } else {
          const customer = await getCustomer(customerId);
          setName(customer.name);
        }
      } catch (error) {
        console.error('Error loading customer:', error);
        setName('Unknown');
      }
    };
    
    if (customerId) {
      loadCustomer();
    } else {
      setName('N/A');
    }
  }, [customerId, getCustomer, customerCache]);
  
  return <span>{name}</span>;
};

const Parts: React.FC = () => {
  // Use the async cache hook for customer data
  const [getCustomer, customerCache] = useAsyncCache<Customer>(getCustomerById);
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchParts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('parts')
          .select('*');
        
        if (error) {
          throw error;
        }
        
        setParts(data || []);
      } catch (error) {
        console.error('Error fetching parts:', error);
        toast.error('Failed to load parts inventory');
      } finally {
        setLoading(false);
      }
    };
    
    fetchParts();
  }, []);
  
  return (
    <div className="container p-4">
      <h1 className="text-2xl font-bold mb-4">Parts Inventory</h1>
      
      {loading ? (
        <div className="text-center py-8">Loading parts inventory...</div>
      ) : parts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No parts in inventory. Add parts to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 text-left">Name</th>
                <th className="py-2 px-4 text-left">Description</th>
                <th className="py-2 px-4 text-left">Part Number</th>
                <th className="py-2 px-4 text-right">Quantity</th>
                <th className="py-2 px-4 text-right">Price</th>
                <th className="py-2 px-4 text-left">Vendor</th>
              </tr>
            </thead>
            <tbody>
              {parts.map(part => (
                <tr key={part.id} className="border-t border-gray-200">
                  <td className="py-2 px-4">{part.name}</td>
                  <td className="py-2 px-4">{part.description || 'N/A'}</td>
                  <td className="py-2 px-4">{part.part_number || 'N/A'}</td>
                  <td className="py-2 px-4 text-right">
                    <span className={`${part.quantity <= part.reorder_level ? 'text-red-600 font-medium' : ''}`}>
                      {part.quantity}
                    </span>
                    {part.quantity <= part.reorder_level && (
                      <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                        Low Stock
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-right">${part.price.toFixed(2)}</td>
                  <td className="py-2 px-4">
                    {part.vendor_id ? (
                      <CustomerCell 
                        customerId={part.vendor_id} 
                        getCustomer={getCustomer} 
                        customerCache={customerCache}
                      />
                    ) : part.vendor_name || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Parts;
