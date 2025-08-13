
import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDataContext } from '@/context/data/DataContext';
import { useAuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/utils/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, SortAsc, SortDesc, FileText } from 'lucide-react';
import PartDialog from '@/components/part/PartDialog';
import AssignToInvoiceDialog from '@/components/part/AssignToInvoiceDialog';
import { Part } from '@/types';

const Parts: React.FC = () => {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
  const [showPartDialog, setShowPartDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedPartForAssignment, setSelectedPartForAssignment] = useState<Part | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { getCustomerById } = useDataContext();
  const { currentUser } = useAuthContext();
  
  // Check permissions
  const userCanManageParts = hasPermission(currentUser, 'parts', 'manage') || hasPermission(currentUser, 'parts', 'create');
  const userCanViewParts = hasPermission(currentUser, 'parts', 'view');

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
        console.log('Fetched parts from database:', partsData);
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
      console.log('Saving part with data:', part);
      
      // Use crypto.randomUUID() for proper UUID generation
      const partWithId = {
        id: crypto.randomUUID(),
        name: part.name,
        description: part.description,
        part_number: part.part_number,
        price: part.price,
        quantity: part.quantity,
        vendor_id: part.vendor_id || null,
        vendor_name: part.vendor_name,
        invoice_ids: part.invoice_ids || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Inserting part with proper UUID:', partWithId);

      const { data, error } = await supabase
        .from('parts')
        .insert([partWithId])
        .select()
        .single();

      if (error) {
        console.error('Database error inserting part:', error);
        throw error;
      }

      console.log('Part successfully inserted:', data);

      // Add the new part to the local state immediately
      setParts(prev => {
        const updated = [...prev, data];
        console.log('Updated parts state:', updated);
        return updated;
      });
      
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
      setShowPartDialog(false);
    } catch (error) {
      console.error('Error saving part:', error);
      toast.error('Failed to save part');
      throw error;
    }
  };

  const handleAssignToInvoice = (part: Part) => {
    setSelectedPartForAssignment(part);
    setShowAssignDialog(true);
  };

  const handleAssignmentComplete = () => {
    // Refresh the parts list
    const fetchParts = async () => {
      try {
        const { data, error } = await supabase
          .from('parts')
          .select('*');

        if (error) {
          throw error;
        }

        setParts(data || []);
      } catch (error) {
        console.error('Error refreshing parts:', error);
        toast.error('Failed to refresh parts list');
      }
    };

    fetchParts();
    setShowAssignDialog(false);
    setSelectedPartForAssignment(null);
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

  // Filter and sort parts
  const filteredAndSortedParts = useMemo(() => {
    let filtered = parts.filter(part => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getVendorName(part).toLowerCase().includes(searchTerm.toLowerCase());
      
      // Stock filter
      const isLowStock = part.quantity <= (part.reorder_level || 5);
      const matchesStock = stockFilter === 'all' || 
        (stockFilter === 'low' && isLowStock) ||
        (stockFilter === 'normal' && !isLowStock);
      
      // Assignment filter
      const isAssigned = part.invoice_ids && part.invoice_ids.length > 0;
      const matchesAssignment = assignmentFilter === 'all' ||
        (assignmentFilter === 'assigned' && isAssigned) ||
        (assignmentFilter === 'workshop' && !isAssigned);
      
      return matchesSearch && matchesStock && matchesAssignment;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'vendor':
          aValue = getVendorName(a).toLowerCase();
          bValue = getVendorName(b).toLowerCase();
          break;
        case 'part_number':
          aValue = a.part_number || '';
          bValue = b.part_number || '';
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [parts, searchTerm, stockFilter, assignmentFilter, sortBy, sortOrder, customerNames]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStockFilter('all');
    setAssignmentFilter('all');
    setSortBy('name');
    setSortOrder('asc');
  };

  console.log('Current parts state:', parts);

  return (
    <div className="container p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Parts Inventory</h1>
        {userCanManageParts && (
          <Button onClick={() => setShowPartDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Part
          </Button>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search parts, vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger>
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Stock level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock Levels</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="normal">Normal Stock</SelectItem>
          </SelectContent>
        </Select>

        <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Assignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Parts</SelectItem>
            <SelectItem value="workshop">Workshop Inventory</SelectItem>
            <SelectItem value="assigned">Assigned to Jobs</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="quantity">Quantity</SelectItem>
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="vendor">Vendor</SelectItem>
            <SelectItem value="part_number">Part Number</SelectItem>
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

      {loading ? (
        <div className="text-center py-8">Loading parts inventory...</div>
      ) : (
        <>
          {/* Results Summary */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredAndSortedParts.length} of {parts.length} parts
          </div>

          {filteredAndSortedParts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {parts.length === 0 
                ? "No parts in inventory. Add parts to get started."
                : "No parts match your search criteria."
              }
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
                    <th className="py-2 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedParts.map(part => (
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
                      <td className="py-2 px-4 text-center">
                        {userCanManageParts && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAssignToInvoice(part as Part)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3" />
                            Assign
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <PartDialog
        open={showPartDialog}
        onOpenChange={setShowPartDialog}
        onSave={handleSavePart}
      />

      <AssignToInvoiceDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        part={selectedPartForAssignment}
        onAssignmentComplete={handleAssignmentComplete}
      />
    </div>
  );
};

export default Parts;
