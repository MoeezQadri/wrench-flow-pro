
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDataContext } from '@/context/data/DataContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import PartDialog from '@/components/part/PartDialog';
import { Part } from '@/types';

const Parts: React.FC = () => {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
  const [showPartDialog, setShowPartDialog] = useState(false);
  const { getCustomerById } = useDataContext();

  // Helper to generate UUID
  const generateUUID = () => crypto.randomUUID();

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

  const handleSavePart = async (part: Part) => {
    try {
      const partWithId = {
        id: part.id || generateUUID(),
        name: part.name,
        description: part.description,
        part_number: part.part_number,
        price: part.price,
        quantity: part.quantity,
        vendor_id: part.vendor_id,
        vendor_name: part.vendor_name,
        invoice_ids: part.invoice_ids || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('parts')
        .insert([partWithId])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Add the new part to the local state
      setParts(prev => [...prev, data]);
      
      // If the part has a vendor_id and we don't have the name cached, load it
      if (data.vendor_id && !customerNames[data.vendor_id]) {
        const customer = await getCustomerById(data.vendor_id);
        if (customer) {
          setCustomerNames(prev => ({
            ...prev,
            [data.vendor_id]: customer.name
          }));
        }
      }

      toast.success('Part added successfully');
      console.log('Part saved successfully:', data);
    } catch (error) {
      console.error('Error saving part:', error);
      toast.error('Failed to save part');
      throw error;
    }
  };

  const getVendorName = (part: any) => {
    if (part.vendor_id) {
      return customerNames[part.vendor_id] || 'Loading...';
    }
    return part.vendor_name || 'N/A';
  };

  const getAssignmentStatus = (part: any) => {
    if (part.invoice_ids && part.invoice_ids.length > 0) {
      return (
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
          Assigned to {part.invoice_ids.length} invoice(s)
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
        Workshop Inventory
      </span>
    );
  };

  return (
    <div className="container p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Parts Inventory</h1>
        <Button onClick={() => setShowPartDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Part
        </Button>
      </div>

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
                <th className="py-2 px-4 text-left">Assignment</th>
              </tr>
            </thead>
            <tbody>
              {parts.map(part => (
                <tr key={part.id} className="border-t border-gray-200">
                  <td className="py-2 px-4">{part.name}</td>
                  <td className="py-2 px-4">{part.description || 'N/A'}</td>
                  <td className="py-2 px-4">{part.part_number || 'N/A'}</td>
                  <td className="py-2 px-4 text-right">
                    <span className={`${part.quantity <= (part.reorder_level || 5) ? 'text-red-600 font-medium' : ''}`}>
                      {part.quantity}
                    </span>
                    {part.quantity <= (part.reorder_level || 5) && (
                      <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                        Low Stock
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-right">${part.price.toFixed(2)}</td>
                  <td className="py-2 px-4">{getVendorName(part)}</td>
                  <td className="py-2 px-4">{getAssignmentStatus(part)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PartDialog
        open={showPartDialog}
        onOpenChange={setShowPartDialog}
        onSave={handleSavePart}
      />
    </div>
  );
};

export default Parts;
