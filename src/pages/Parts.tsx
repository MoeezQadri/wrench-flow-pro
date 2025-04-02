
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, AlertTriangle, ShoppingBag, Search, Tag, Truck } from "lucide-react";
import { toast } from "sonner";
import PartDialog from "@/components/part/PartDialog";
import VendorDialog from "@/components/part/VendorDialog";
import { parts, vendors, invoices, getCustomerById, getCurrentUser, hasPermission } from "@/services/data-service";
import { Part, Invoice } from "@/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Parts = () => {
  const [isPartDialogOpen, setIsPartDialogOpen] = useState(false);
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | undefined>(undefined);
  const [partsList, setPartsList] = useState<Part[]>(parts);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<string | undefined>(undefined);
  
  const currentUser = getCurrentUser();
  const canManageParts = hasPermission(currentUser, "parts", "manage");

  // Get all invoices with customers
  const invoicesWithCustomers = invoices.map(invoice => {
    const customer = getCustomerById(invoice.customerId);
    return {
      id: invoice.id,
      customerName: customer?.name || "Unknown Customer",
      vehicleInfo: `${invoice.vehicleInfo.make} ${invoice.vehicleInfo.model} (${invoice.vehicleInfo.licensePlate})`
    };
  });

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
    
    // TODO: In a real app, we would track which parts were sold to which customers
    // For now, we're just returning all parts when a customer is selected
    return matchesSearch;
  });

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
      // In a real app, we would add the part to the invoice here
      toast.success(`Part added to invoice #${selectedInvoice}`);
      // This would update the invoice with the part
    }
  };

  const needsReorder = (part: Part) => {
    return part.reorderLevel !== undefined && part.quantity <= part.reorderLevel;
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
              <SelectValue placeholder="Filter by customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
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
                <SelectValue placeholder="Add part to invoice..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select an invoice</SelectItem>
                {invoicesWithCustomers.map(invoice => (
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
                    {needsReorder(part) ? (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Reorder
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        In Stock
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManageParts && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPart(part)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredParts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
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
