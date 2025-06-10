
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDataContext } from '@/context/data/DataContext';

const Parts: React.FC = () => {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
  const { getCustomerById } = useDataContext();

  // Load customer names for all vendors at once
  const loadCustomerNames = async (vendorIds: string[]) => {
    const uniqueVendorIds = [...new Set(vendorIds.filter(Boolean))];
    const nameMap: Record<string, string> = {};
    
    for (const vendorId of uniqueVendorIds) {
      try {
        const customer = await getCustomerById(vendorId);
        nameMap[vendorId] = customer?.name || 'Unknown';
      } catch (error) {
        console.error('Error loading customer:', error);
        nameMap[vendorId] = 'Unknown';
      }
    }
    
    setCustomerNames(nameMap);
  };

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

        const partsData = data || [];
        setParts(partsData);

        // Load customer names for all vendor IDs
        const vendorIds = partsData.map(part => part.vendor_id).filter(Boolean);
        if (vendorIds.length > 0) {
          await loadCustomerNames(vendorIds);
        }
      } catch (error) {
        console.error('Error fetching parts:', error);
        toast.error('Failed to load parts inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchParts();
  }, [getCustomerById]);

  const getVendorName = (part: any) => {
    if (part.vendor_id) {
      return customerNames[part.vendor_id] || 'Loading...';
    }
    return part.vendor_name || 'N/A';
  };

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
                  <td className="py-2 px-4">{getVendorName(part)}</td>
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
