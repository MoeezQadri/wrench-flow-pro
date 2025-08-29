import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useDataContext } from '@/context/data/DataContext';
import { useAuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/utils/permissions';
import PageWrapper from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus, Search, Filter, SortAsc, SortDesc, FileText, Users, Package, AlertTriangle, Grid3X3, List } from 'lucide-react';
import PartDialog from '@/components/part/PartDialog';
import VendorManagement from '@/components/vendor/VendorManagement';
import AssignToInvoiceDialog from '@/components/part/AssignToInvoiceDialog';
import { Part } from '@/types';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';

const Parts: React.FC = () => {
  const [showPartDialog, setShowPartDialog] = useState(false);
  const [showVendorManagement, setShowVendorManagement] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedPartForAssignment, setSelectedPartForAssignment] = useState<Part | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { parts, addPart, refreshAllData, vendors, loadParts, loadVendors } = useDataContext();
  const { currentUser } = useAuthContext();
  const { formatCurrency } = useOrganizationSettings();
  
  // Check permissions
  const userCanManageParts = hasPermission(currentUser, 'parts', 'manage') || hasPermission(currentUser, 'parts', 'create');
  const userCanViewParts = hasPermission(currentUser, 'parts', 'view');

  // Remove the customerNames loading logic since we should use vendors instead
  // const loadCustomerNames = useCallback(async (vendorIds: string[]) => {
  //   // This was incorrectly trying to load customer names for vendor IDs
  // }, [getCustomerById]);

  // useEffect(() => {
  //   // This was incorrectly loading customer names when we need vendor names
  // }, [parts, loadCustomerNames]);

  const handleSavePart = async (part: Part) => {
    try {
      console.log('Saving part with data:', part);
      await addPart(part);
      setShowPartDialog(false);
    } catch (error) {
      console.error('Error saving part:', error);
      // Error is already handled in addPart
    }
  };

  const handleAssignToInvoice = (part: Part) => {
    setSelectedPartForAssignment(part);
    setShowAssignDialog(true);
  };

  const handleAssignmentComplete = () => {
    // Refresh all data to get updated parts
    refreshAllData();
    setShowAssignDialog(false);
    setSelectedPartForAssignment(null);
  };

  const handleVendorManagement = () => {
    setShowVendorManagement(true);
  };

  const handleVendorManagementClose = () => {
    setShowVendorManagement(false);
    refreshAllData();
  };

  const getVendorName = (part: any) => {
    if (part.vendor_id && part.vendor_id !== "none") {
      const vendor = vendors.find(v => v.id === part.vendor_id);
      return vendor?.name || 'Unknown';
    }
    return part.vendor_name || 'N/A';
  };

  const getAssignmentStatus = (part: any) => {
    if (part.invoice_ids && part.invoice_ids.length > 0) {
      return (
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
          Assigned to {part.invoice_ids.length} invoice(s)
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
        Workshop Inventory
      </Badge>
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
  }, [parts, searchTerm, stockFilter, assignmentFilter, sortBy, sortOrder, vendors]);

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

  const headerActions = userCanManageParts ? (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={handleVendorManagement} className="flex items-center gap-2">
        <Users className="w-4 h-4" />
        Manage Vendors
      </Button>
      <Button onClick={() => setShowPartDialog(true)} className="flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Add Part
      </Button>
    </div>
  ) : undefined;

  return (
    <PageWrapper
      title="Parts Inventory"
      headerActions={headerActions}
      loadData={async () => {
        await Promise.all([loadParts(), loadVendors()]);
      }}
      skeletonType="grid"
      className="container max-w-7xl mx-auto"
    >
      <div className="space-y-6">

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Search & Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search parts, vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Stock level" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md">
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="normal">Normal Stock</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Assignment" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md">
                <SelectItem value="all">All Parts</SelectItem>
                <SelectItem value="workshop">Workshop Inventory</SelectItem>
                <SelectItem value="assigned">Assigned to Jobs</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md">
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="quantity">Quantity</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="part_number">Part Number</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={toggleSortOrder} size="sm">
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4 mr-1" /> : <SortDesc className="h-4 w-4 mr-1" />}
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
              <Button variant="outline" onClick={clearFilters} size="sm">
                Clear Filters
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
                size="sm"
              >
                <Grid3X3 className="h-4 w-4 mr-1" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                size="sm"
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {filteredAndSortedParts.length} of {parts.length} parts</span>
      </div>

          {filteredAndSortedParts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-medium">No parts found</h3>
                    <p className="text-muted-foreground">
                      {parts.length === 0 
                        ? "No parts in inventory. Add parts to get started."
                        : "No parts match your search criteria."
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredAndSortedParts.map(part => (
                    <Card key={part.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-lg leading-tight">{part.name}</CardTitle>
                            {part.part_number && (
                              <p className="text-sm text-muted-foreground">#{part.part_number}</p>
                            )}
                          </div>
                          {part.quantity <= (part.reorder_level || 5) && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Low Stock
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {part.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{part.description}</p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Quantity</p>
                            <p className={`font-medium ${part.quantity <= (part.reorder_level || 5) ? 'text-destructive' : ''}`}>
                              {part.quantity} {part.unit || 'pieces'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Price</p>
                            <p className="font-medium">{formatCurrency(part.price)}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-muted-foreground">Vendor</p>
                            <p className="font-medium">{getVendorName(part)}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          {getAssignmentStatus(part)}
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAndSortedParts.map(part => (
                    <Card key={part.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium text-lg">{part.name}</h3>
                                {part.part_number && (
                                  <p className="text-sm text-muted-foreground">#{part.part_number}</p>
                                )}
                              </div>
                              {part.quantity <= (part.reorder_level || 5) && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Low Stock
                                </Badge>
                              )}
                            </div>
                            
                            {part.description && (
                              <p className="text-sm text-muted-foreground">{part.description}</p>
                            )}
                            
                            <div className="flex flex-wrap gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Qty: </span>
                                <span className={`font-medium ${part.quantity <= (part.reorder_level || 5) ? 'text-destructive' : ''}`}>
                                  {part.quantity} {part.unit || 'pieces'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Price: </span>
                                <span className="font-medium">{formatCurrency(part.price)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Vendor: </span>
                                <span className="font-medium">{getVendorName(part)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            {getAssignmentStatus(part)}
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
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

      {/* Vendor Management Dialog */}
      <Dialog open={showVendorManagement} onOpenChange={setShowVendorManagement}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <VendorManagement onClose={handleVendorManagementClose} />
        </DialogContent>
      </Dialog>

      {/* Part Dialog */}
      <PartDialog
        open={showPartDialog}
        onOpenChange={setShowPartDialog}
        onSave={handleSavePart}
      />

      {/* Assign to Invoice Dialog */}
      {selectedPartForAssignment && (
        <AssignToInvoiceDialog
          open={showAssignDialog}
          onOpenChange={setShowAssignDialog}
          part={selectedPartForAssignment}
          onAssignmentComplete={handleAssignmentComplete}
        />
      )}
      </div>
    </PageWrapper>
  );
};

export default Parts;