import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useDataContext } from '@/context/data/DataContext';
import VendorDialog from '@/components/part/VendorDialog';
import { Vendor } from '@/types';
import { toast } from 'sonner';

const Vendors = () => {
  const { vendors, removeVendor } = useDataContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowVendorDialog(true);
  };

  const handleDelete = async (vendor: Vendor) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      await removeVendor(vendor.id);
    }
  };

  const handleAddNew = () => {
    setSelectedVendor(null);
    setShowVendorDialog(true);
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vendors</h1>
          <p className="text-muted-foreground">Manage your vendor relationships</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Payment Terms</TableHead>
              <TableHead>Credit Limit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-3">
                    <Building className="w-12 h-12 text-muted-foreground" />
                    <div className="text-muted-foreground">
                      {searchTerm ? 'No vendors found matching your search.' : 'No vendors found. Add one to get started.'}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredVendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">
                    {vendor.name}
                  </TableCell>
                  <TableCell>
                    {vendor.contact_name || vendor.contact_person || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {vendor.email || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {vendor.phone || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {vendor.category || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {vendor.payment_terms ? `${vendor.payment_terms} days` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(vendor.credit_limit)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={vendor.is_active !== false ? 'default' : 'secondary'}>
                      {vendor.is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(vendor)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(vendor)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <VendorDialog
        open={showVendorDialog}
        onOpenChange={setShowVendorDialog}
      />
    </div>
  );
};

export default Vendors;