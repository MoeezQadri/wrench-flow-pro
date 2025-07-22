import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useDataContext } from '@/context/data/DataContext';
import { PayableDialog } from '@/components/payable/PayableDialog';
import { Payable } from '@/types';
import { toast } from 'sonner';

const Payables = () => {
  const { payables, removePayable, vendors } = useDataContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showPayableDialog, setShowPayableDialog] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);

  const filteredPayables = payables.filter(payable =>
    payable.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payable.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payable.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getVendorName = (vendorId?: string) => {
    if (!vendorId) return 'N/A';
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.name || 'Unknown Vendor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const handleEdit = (payable: Payable) => {
    setSelectedPayable(payable);
    setShowPayableDialog(true);
  };

  const handleDelete = async (payable: Payable) => {
    if (window.confirm('Are you sure you want to delete this payable?')) {
      await removePayable(payable.id);
    }
  };

  const handleAddNew = () => {
    setSelectedPayable(null);
    setShowPayableDialog(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payables</h1>
          <p className="text-muted-foreground">Manage amounts owed to vendors</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Payable
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search payables..."
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
              <TableHead>Ref #</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-3">
                    <FileText className="w-12 h-12 text-muted-foreground" />
                    <div className="text-muted-foreground">
                      {searchTerm ? 'No payables found matching your search.' : 'No payables found. Add one to get started.'}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPayables.map((payable) => (
                <TableRow key={payable.id}>
                  <TableCell className="font-medium">
                    {payable.reference_number || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {payable.description}
                    </div>
                  </TableCell>
                  <TableCell>{getVendorName(payable.vendor_id)}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(payable.amount)}
                  </TableCell>
                  <TableCell>
                    {formatDate(payable.due_date)}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(payable.status)} text-white`}>
                      {payable.status.charAt(0).toUpperCase() + payable.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(payable.paid_amount || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(payable)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(payable)}
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

      <PayableDialog
        open={showPayableDialog}
        onOpenChange={setShowPayableDialog}
        payable={selectedPayable}
        onPayableAdded={() => setShowPayableDialog(false)}
        onPayableUpdated={() => setShowPayableDialog(false)}
      />
    </div>
  );
};

export default Payables;