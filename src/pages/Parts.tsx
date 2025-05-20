
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, ShoppingBag, Search, Tag, Truck, Link, Link2Off } from "lucide-react";
import { toast } from "sonner";
import PartDialog from "@/components/part/PartDialog";
import VendorDialog from "@/components/part/VendorDialog";
import { parts, vendors, invoices, getCustomerById, getCurrentUser, hasPermission } from "@/services/data-service";
import { Part, Invoice } from "@/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const Parts = () => {
  const [isPartDialogOpen, setIsPartDialogOpen] = useState(false);
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | undefined>(undefined);
  const [partsList, setPartsList] = useState<Part[]>(parts);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<string | undefined>(undefined);
  const [partInvoiceMap, setPartInvoiceMap] = useState<Record<string, string[]>>({});
  
  const currentUser = getCurrentUser();
  const canManageParts = hasPermission(currentUser, "parts", "manage");

  // Get all invoices with customers
  const invoicesWithCustomers = invoices.map(invoice => {
    const customer = getCustomerById(invoice.customerId);
    return {
      id: invoice.id,
      customerName: customer?.name || "Unknown Customer",
      vehicleInfo: `${invoice.vehicleInfo.make} ${invoice.vehicleInfo.model} (${invoice.vehicleInfo.licensePlate})`,
      status: invoice.status
    };
  });

  // Only show active invoices for tagging
  const activeInvoices = invoicesWithCustomers.filter(
    invoice => ["open", "in-progress", "completed", "partial"].includes(invoice.status)
  );

  // Filter parts based on search and customer filter
  const filteredParts = partsList.filter(part => {
    const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          part.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (part.partNumber && part.partNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (part.vendorName && part.vendorName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // If we're not filtering by customer, just check the search match
    if (customerFilter === "all") {
      return matchesSearch;
    }
    
    // Check if the part is associated with the selected invoice/customer
    return matchesSearch && partInvoiceMap[part.id]?.includes(customerFilter);
  });

  // Effect to simulate loading parts-invoice associations
  // In a real app, this would be loaded from your database
  useEffect(() => {
    // Simulating stored associations between parts and invoices
    // In a real implementation, this would be fetched from your backend
    const mockPartInvoiceAssociations: Record<string, string[]> = {};
    
    // Add some example associations
    parts.forEach((part, index) => {
      if (index % 3 === 0 && invoices.length > 0) { // Associate every third part
        const randomInvoiceIndex = Math.floor(Math.random() * invoices.length);
        mockPartInvoiceAssociations[part.id] = [invoices[randomInvoiceIndex].id];
      } else {
        mockPartInvoiceAssociations[part.id] = [];
      }
    });
    
    setPartInvoiceMap(mockPartInvoiceAssociations);
  }, []);

  const handleAddPart = (invoiceId?: string) => {
    setSelectedPart(undefined);
    setSelectedInvoice(invoiceId);
    setIsPartDialogOpen(true);
  };

  const handleAddVendor = () => {
    setIsVendorDialogOpen(true);
  };

  const handleEditPart = (part: Part) => {
    setSelectedPart(part);
    setSelectedInvoice(undefined);
    setIsPartDialogOpen(true);
  };

  const handleSavePart = (part: Part) => {
    setPartsList(prev => {
      const index = prev.findIndex(p => p.id === part.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = part;
        return updated;
      } else {
        return [...prev, part];
      }
    });

    // If an invoice was selected when creating this part, it should be added to that invoice
    if (selectedInvoice) {
      // Update the part-invoice association
      setPartInvoiceMap(prev => ({
        ...prev,
        [part.id]: [...(prev[part.id] || []), selectedInvoice]
      }));
      
      toast.success(`Part added to invoice #${selectedInvoice.substring(0, 8)}`);
    }
  };

  const handleTagPart = (partId: string, invoiceId: string) => {
    // Update the part-invoice mapping
    setPartInvoiceMap(prev => {
      const currentAssociations = prev[partId] || [];
      
      // Check if this part is already associated with this invoice
      if (currentAssociations.includes(invoiceId)) {
        toast.info("This part is already associated with the selected invoice");
        return prev;
      }
      
      const updatedAssociations = {
        ...prev,
        [partId]: [...currentAssociations, invoiceId]
      };
      
      toast.success("Part tagged to invoice successfully");
      return updatedAssociations;
    });
  };

  const handleRemoveTag = (partId: string, invoiceId: string) => {
    setPartInvoiceMap(prev => {
      const currentAssociations = prev[partId] || [];
      const updatedAssociations = {
        ...prev,
        [partId]: currentAssociations.filter(id => id !== invoiceId)
      };
      
      toast.success("Part untagged from invoice");
      return updatedAssociations;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parts Inventory</h1>
          <p className="text-muted-foreground">Manage parts inventory and vendors</p>
        </div>
        <div className="flex space-x-2">
          {canManageParts && (
            <>
              <Button onClick={handleAddVendor} variant="outline">
                <Truck className="mr-1 h-4 w-4" />
                Add Vendor
              </Button>
              <Button onClick={() => handleAddPart()}>
                <Plus className="mr-1 h-4 w-4" />
                Add Part
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search parts..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-64">
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by invoice" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Parts</SelectItem>
              {invoicesWithCustomers.map(invoice => (
                <SelectItem key={invoice.id} value={invoice.id}>
                  {invoice.customerName} - {invoice.vehicleInfo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {canManageParts && (
          <div className="w-full md:w-72">
            <Select value={selectedInvoice || "none"} onValueChange={(val) => setSelectedInvoice(val === "none" ? undefined : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select invoice to tag parts..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select an invoice</SelectItem>
                {activeInvoices.map(invoice => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.customerName} - {invoice.vehicleInfo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {selectedInvoice && (
          <Button onClick={() => handleAddPart(selectedInvoice)}>
            <Tag className="mr-1 h-4 w-4" />
            Add Part to Invoice
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Parts List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Associated Invoices</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParts.map((part) => (
                <TableRow key={part.id}>
                  <TableCell className="font-medium">
                    <div>{part.name}</div>
                    {part.partNumber && (
                      <div className="text-xs text-muted-foreground">#{part.partNumber}</div>
                    )}
                  </TableCell>
                  <TableCell>${part.price.toFixed(2)}</TableCell>
                  <TableCell>{part.quantity}</TableCell>
                  <TableCell>{part.vendorName || "—"}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${part.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {part.quantity > 0 ? "In Stock" : "Out of Stock"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2 max-w-xs">
                      {partInvoiceMap[part.id]?.length > 0 ? (
                        partInvoiceMap[part.id].map(invoiceId => {
                          const invoice = invoicesWithCustomers.find(inv => inv.id === invoiceId);
                          if (!invoice) return null;
                          
                          return (
                            <Badge key={invoiceId} variant="outline" className="flex items-center gap-1 pr-1">
                              <span className="truncate max-w-[100px]" title={`${invoice.customerName} - ${invoice.vehicleInfo}`}>
                                #{invoiceId.substring(0, 6)}
                              </span>
                              {canManageParts && (
                                <button 
                                  onClick={() => handleRemoveTag(part.id, invoiceId)}
                                  className="hover:bg-muted rounded-full p-0.5"
                                  title="Remove tag"
                                >
                                  <Link2Off className="h-3 w-3" />
                                </button>
                              )}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canManageParts && selectedInvoice && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTagPart(part.id, selectedInvoice)}
                          title="Tag to selected invoice"
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                      )}
                      {canManageParts && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPart(part)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredParts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ShoppingBag className="w-12 h-12 mb-2 text-muted-foreground/60" />
                      <p>No parts found</p>
                      {canManageParts && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => handleAddPart()}
                        >
                          Add your first part
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PartDialog
        open={isPartDialogOpen}
        onOpenChange={setIsPartDialogOpen}
        onSave={handleSavePart}
        part={selectedPart}
        invoiceId={selectedInvoice}
      />
      
      <VendorDialog
        open={isVendorDialogOpen}
        onOpenChange={setIsVendorDialogOpen}
      />
    </div>
  );
};

export default Parts;
