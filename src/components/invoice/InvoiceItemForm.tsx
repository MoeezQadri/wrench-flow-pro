import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { InvoiceItem, Part, Task, Vendor } from "@/types";
import { useDataContext } from "@/context/data/DataContext";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import VendorDialog from "@/components/part/VendorDialog";
import { useOrganizationContext } from "@/hooks/useOrganizationContext";
import { Plus } from "lucide-react";

interface InvoiceItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: InvoiceItem) => void;
  availableParts: Part[];
  availableTasks: Task[];
  vehicleId: string;
  editingItem?: InvoiceItem | null;
  invoiceId?: string;
}

const InvoiceItemForm: React.FC<InvoiceItemFormProps> = ({
  open,
  onOpenChange,
  onSave,
  availableParts,
  availableTasks,
  vehicleId,
  editingItem,
  invoiceId
}) => {
  // Form state
  const [description, setDescription] = useState("");
  const [partName, setPartName] = useState("");
  const [type, setType] = useState<'part' | 'labor' | 'other'>('part');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [cost, setCost] = useState(0);
  const [unitOfMeasure, setUnitOfMeasure] = useState("piece");
  const [selectedPartId, setSelectedPartId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  
  // Labor lines are always recorded as tasks (no opt-in), see labor handling in handleSave

  
  // Vendor selection for parts
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  
  // Custom part data
  const [partNumber, setPartNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  
  // Custom labor data
  const [laborRate, setLaborRate] = useState(50);
  const [laborBillingType, setLaborBillingType] = useState<'hourly' | 'lumpsum'>('hourly');
  const [laborMechanicId, setLaborMechanicId] = useState<string>("unassigned");
  const [laborStatus, setLaborStatus] = useState<'in-progress' | 'completed'>('completed');
  const [laborHoursEstimated, setLaborHoursEstimated] = useState<number>(1);
  const [laborHoursSpent, setLaborHoursSpent] = useState<number>(0);

  const { mechanics, vendors } = useDataContext();
  const { getCurrencySymbol, formatCurrency } = useOrganizationSettings();


  // Debug logging for available data
  useEffect(() => {
    console.log('InvoiceItemForm debug:', {
      availableParts: availableParts?.length || 0,
      availableTasks: availableTasks?.length || 0,
      mechanics: mechanics?.length || 0,
      partsPreview: availableParts?.slice(0, 2),
      tasksPreview: availableTasks?.slice(0, 2),
      mechanicsPreview: mechanics?.slice(0, 2)
    });
  }, [availableParts, availableTasks, mechanics]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (editingItem) {
        // Populate form with editing item data
        setDescription(editingItem.description);
        setPartName(editingItem.description); // For parts, name and description are the same initially
        setType(editingItem.type as 'part' | 'labor' | 'other');
        setQuantity(editingItem.quantity);
        setPrice(editingItem.price);
        setCost(editingItem.cost || 0);
        setUnitOfMeasure(editingItem.unit_of_measure || "piece");
        setSelectedPartId(editingItem.part_id || "");
        setSelectedTaskId(editingItem.task_id || "");
        

        
        // Populate custom data if available
        if (editingItem.custom_part_data) {
          setPartNumber(editingItem.custom_part_data.part_number || "");
          setManufacturer(editingItem.custom_part_data.manufacturer || "");
          setCategory(editingItem.custom_part_data.category || "");
          setLocation(editingItem.custom_part_data.location || "");
        }
        
        if (editingItem.custom_labor_data) {
          setLaborRate(editingItem.custom_labor_data.labor_rate || 50);
          setLaborBillingType(editingItem.custom_labor_data.billing_type || 'hourly');
          setLaborMechanicId(editingItem.custom_labor_data.mechanic_id || "unassigned");
          setLaborStatus(editingItem.custom_labor_data.status || 'completed');
          setLaborHoursEstimated(
            editingItem.custom_labor_data.hours_estimated ?? editingItem.quantity ?? 1
          );
          setLaborHoursSpent(editingItem.custom_labor_data.hours_spent ?? 0);
        }
      } else {
        // Reset form for new item
        setDescription("");
        setPartName("");
        setType('part');
        setQuantity(1);
        setPrice(0);
        setCost(0);
        setUnitOfMeasure("piece");
        setSelectedPartId("");
        setSelectedTaskId("");
        

        setPartNumber("");
        setManufacturer("");
        setCategory("");
        setLocation("");
        setLaborRate(50);
        setLaborBillingType('hourly');
        setLaborMechanicId("unassigned");
        setLaborStatus('completed');
        setLaborHoursEstimated(1);
        setLaborHoursSpent(0);
        setSelectedVendorId("");
      }
    }
  }, [open, editingItem]);

  // Auto-fill description and price when selecting parts or tasks
  useEffect(() => {
    if (selectedPartId && availableParts) {
      const selectedPart = availableParts.find(p => p.id === selectedPartId);
      if (selectedPart) {
        setDescription(selectedPart.name);
        setPartName(selectedPart.name);
        setPrice(selectedPart.price);
        setCost(selectedPart.cost || 0);
        setUnitOfMeasure(selectedPart.unit || "piece");
        setSelectedVendorId(selectedPart.vendor_id || "");
        setPartNumber(selectedPart.part_number || "");
      }
    }
  }, [selectedPartId, availableParts]);

  useEffect(() => {
    if (selectedTaskId && availableTasks) {
      const selectedTask = availableTasks.find(t => t.id === selectedTaskId);
      if (selectedTask) {
        const taskBilling = selectedTask.billing_type === 'lumpsum' ? 'lumpsum' : 'hourly';
        setDescription(selectedTask.title);
        setPrice(selectedTask.price || 0);
        setLaborBillingType(taskBilling);
        setQuantity(taskBilling === 'lumpsum' ? 1 : (selectedTask.hoursEstimated || 1));
        setUnitOfMeasure(taskBilling === 'lumpsum' ? "set" : "hour");
      }
    }
  }, [selectedTaskId, availableTasks]);

  const handlePartSelection = (value: string) => {
    if (value === "custom") {
      setSelectedPartId("");
      setPartName("");
      setDescription("");
      setPrice(0);
      setCost(0);
      setUnitOfMeasure("piece");
      setSelectedVendorId("");
      setPartNumber("");
      setManufacturer("");
      setCategory("");
      setLocation("");
      return;
    }

    setSelectedPartId(value);
  };

  const handleSave = async () => {
    // Validate required fields based on type
    if (type === 'part' && !partName.trim()) {
      alert('Please enter a part name.');
      return;
    } else if (type !== 'part' && !description.trim()) {
      alert('Please enter a description.');
      return;
    }

    // New parts require a vendor; existing inventory parts inherit their vendor.
    if (type === 'part' && !selectedPartId && !selectedVendorId) {
      alert('Please select a vendor for the part.');
      return;
    }

    const itemDescription = type === 'part' ? partName.trim() : description.trim();

    const vendor = vendors.find((v: Vendor) => v.id === selectedVendorId);

    const newItem: InvoiceItem = {
      id: editingItem?.id || `item-${Date.now()}`,
      description: itemDescription,
      type,
      quantity,
      price,
      cost: type === 'part' ? cost : 0,
      unit_of_measure: unitOfMeasure,
      part_id: selectedPartId || undefined,
      task_id: selectedTaskId && selectedTaskId !== 'none' ? selectedTaskId : undefined,
      // The inventory part (and its purchase expense) is created once, when the
      // invoice/estimate is saved — never before, so nothing is left orphaned.
      creates_inventory_part: (type === 'part' || type === 'other') && !selectedPartId,
      creates_task: type === 'labor' && !selectedTaskId,
      is_auto_added: false
    };

    if ((type === 'part' || type === 'other') && !selectedPartId) {
      newItem.custom_part_data = {
        part_number: partNumber || undefined,
        manufacturer: manufacturer || undefined,
        category: type === 'other' ? 'other' : (category || undefined),
        location: location || undefined,
        vendor_id: selectedVendorId || undefined,
        vendor_name: vendor?.name
      } as any;
    }


    // Labor lines always carry labor data; the task row is created/updated
    // server-side when the invoice is saved (single source of truth, no duplicates)
    if (type === 'labor') {
      newItem.custom_labor_data = {
        labor_rate: laborRate,
        billing_type: laborBillingType,
        mechanic_id: laborMechanicId === "unassigned" ? undefined : laborMechanicId,
        status: laborStatus,
        hours_estimated:
          laborBillingType === 'lumpsum' ? laborHoursEstimated : quantity,
        hours_spent: laborHoursSpent || undefined
      };
      // Lumpsum labor is billed as a single flat fee, regardless of hours
      if (laborBillingType === 'lumpsum') {
        newItem.quantity = 1;
      }
    }


    onSave(newItem);
    onOpenChange(false);
  };

  const handleVendorAdded = async () => {
    // Vendor will be automatically added to the context when created
    // We can optionally set the new vendor as selected here
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Edit Invoice Item' : 'Add Invoice Item'}
          </DialogTitle>
          <DialogDescription>
            Add or edit an item for this invoice. You can select from existing parts/tasks or create custom items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Type */}
          <div>
            <Label>Item Type</Label>
            <Select value={type} onValueChange={(value: 'part' | 'labor' | 'other') => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select item type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="part">Part</SelectItem>
                <SelectItem value="labor">Labor</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>


          {/* Task Selection */}
          {type === 'labor' && (
            <div>
              <Label>Select Task (Optional)</Label>
              <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select from completed tasks or leave blank for custom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Custom Labor (not from completed tasks)</SelectItem>
                  {availableTasks && availableTasks.length > 0 ? (
                    availableTasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title} - {formatCurrency(task.price || 0)} ({task.hoursEstimated || 1}h)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-tasks" disabled>No completed tasks available</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {availableTasks?.length === 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  No completed tasks available. You can still create custom labor items.
                </p>
              )}
            </div>
          )}

          {/* Existing inventory selection or custom part name */}
          {type === 'part' && (
            <div>
              <Label htmlFor="inventoryPart">Inventory Part</Label>
              <Select value={selectedPartId || "custom"} onValueChange={handlePartSelection}>
                <SelectTrigger id="inventoryPart">
                  <SelectValue placeholder="Create a new part" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Create a new part</SelectItem>
                  {(availableParts || []).map((part) => (
                    <SelectItem key={part.id} value={part.id}>
                      {part.name} — {formatCurrency(part.price)} selling / {formatCurrency(part.cost || 0)} cost
                    </SelectItem>
                  ))}
                  {(availableParts || []).length === 0 && (
                    <SelectItem value="no-parts" disabled>No inventory parts available</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Existing parts inherit their saved purchase cost and vendor.
              </p>
            </div>
          )}

          {/* Part Name for parts, Description for others */}
          {type === 'part' ? (
            <div>
              <Label htmlFor="partName">{selectedPartId ? 'Invoice Part Name' : 'New Part Name *'}</Label>
              <Input
                id="partName"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                placeholder="Enter part name"
                required
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter item description"
                required
              />
            </div>
          )}

          {/* Quantity and Price */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="quantity">
                {type === 'labor' && laborBillingType === 'lumpsum' ? 'Quantity (fixed at 1)' : 'Quantity *'}
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={type === 'labor' && laborBillingType === 'lumpsum' ? 1 : quantity}
                disabled={type === 'labor' && laborBillingType === 'lumpsum'}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                required
              />
            </div>
            <div>
              <Label htmlFor="price">
                {type === 'labor' && laborBillingType === 'lumpsum'
                  ? `Lumpsum Fee (${getCurrencySymbol()}) *`
                  : `Unit Price (${getCurrencySymbol()}) *`}
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
            </div>
            {type === 'part' && (
              <div>
                <Label htmlFor="cost">Purchase Cost ({getCurrencySymbol()}) *</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  disabled={Boolean(selectedPartId)}
                  required={!selectedPartId}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedPartId ? 'Inherited from inventory.' : 'Used for vendor dues and profit reporting.'}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="unitOfMeasure">Unit of Measure</Label>
              <Select value={unitOfMeasure} onValueChange={setUnitOfMeasure}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="piece">Piece</SelectItem>
                  <SelectItem value="hour">Hour</SelectItem>
                  <SelectItem value="liter">Liter</SelectItem>
                  <SelectItem value="kg">Kilogram</SelectItem>
                  <SelectItem value="set">Set</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Part Details Section */}
          {type === 'part' && !selectedPartId && (
            <div className="space-y-4 border-t pt-4">
              <div className="text-sm text-muted-foreground">
                This new part will be saved to inventory and linked to this invoice.
              </div>

              {/* Vendor Selection with Add Button */}
              <div>
                <Label htmlFor="vendorSelect">Vendor (Required)</Label>
                <div className="flex gap-2">
                  <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select vendor for part" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor: Vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsVendorDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="partNumber">Part Number</Label>
                  <Input
                    id="partNumber"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    placeholder="P-12345"
                  />
                </div>
                <div>
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    placeholder="OEM or aftermarket brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Engine, Brake, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Shelf A1, etc."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="partDescription">Description</Label>
                <Textarea
                  id="partDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed part description"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Other Item Creation */}
          {type === 'other' && !selectedPartId && (
            <div className="space-y-4 border-t pt-4">
              <div className="text-sm text-muted-foreground">
                This item will be automatically saved to the parts database and linked to this invoice.
              </div>

              {/* Vendor Selection */}
              <div>
                <Label htmlFor="vendorSelect">Vendor (Optional)</Label>
                <div className="flex gap-2">
                  <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select vendor for item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No vendor</SelectItem>
                      {vendors.map((vendor: Vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsVendorDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="partNumber">Item Number</Label>
                  <Input
                    id="partNumber"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    placeholder="I-12345"
                  />
                </div>
                <div>
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    placeholder="Brand Name"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Supplies, Materials, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="location">Storage Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Shelf A-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Labor details — every labor line is recorded as a task for this invoice */}
          {type === 'labor' && !selectedTaskId && (
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                This labor line is saved to the Tasks list and tagged to this invoice.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted p-4 rounded-lg">
                <div>
                  <Label>Billing Type</Label>
                  <Select
                    value={laborBillingType}
                    onValueChange={(value: 'hourly' | 'lumpsum') => {
                      setLaborBillingType(value);
                      if (value === 'lumpsum') setQuantity(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly (quantity × rate)</SelectItem>
                      <SelectItem value="lumpsum">Lumpsum (flat fee)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {laborBillingType === 'lumpsum'
                      ? 'A single flat fee is charged. Mechanic hours are still tracked on the task.'
                      : 'Charged per hour based on quantity.'}
                  </p>
                </div>
                <div>
                  <Label htmlFor="laborRate">Labor Rate ({getCurrencySymbol()}/hour)</Label>
                  <Input
                    id="laborRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={laborRate}
                    onChange={(e) => setLaborRate(parseFloat(e.target.value) || 50)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted p-4 rounded-lg">
                <div>
                  <Label>Assigned Mechanic</Label>
                  <Select
                    value={laborMechanicId}
                    onValueChange={(value) => {
                      setLaborMechanicId(value);
                      if (value !== "unassigned" && laborStatus === 'completed') {
                        setLaborStatus('in-progress');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {(mechanics || []).map((mechanic) => (
                        <SelectItem key={mechanic.id} value={mechanic.id}>
                          {mechanic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    The task appears in Tasks for this mechanic.
                  </p>
                </div>
                <div>
                  <Label>Task Status</Label>
                  <Select
                    value={laborStatus}
                    onValueChange={(value: 'in-progress' | 'completed') => setLaborStatus(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {laborBillingType === 'lumpsum' && (
                  <div>
                    <Label htmlFor="laborHoursEstimated">Estimated Hours</Label>
                    <Input
                      id="laborHoursEstimated"
                      type="number"
                      min="0"
                      step="0.5"
                      value={laborHoursEstimated}
                      onChange={(e) => setLaborHoursEstimated(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="laborHoursSpent">Hours Spent (optional)</Label>
                  <Input
                    id="laborHoursSpent"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder={
                      laborBillingType === 'lumpsum'
                        ? String(laborHoursEstimated)
                        : String(quantity)
                    }
                    value={laborHoursSpent || ""}
                    onChange={(e) => setLaborHoursSpent(parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave blank to track hours later via check-in/out on the Tasks page.
                  </p>
                </div>
              </div>
            </div>
          )}


          {/* Total Calculation */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total:</span>
              <span className="font-bold text-lg">{formatCurrency(price * quantity)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={type === 'part' ? !partName.trim() : !description.trim()}>
            {editingItem ? 'Update Item' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Vendor Dialog */}
      <VendorDialog
        open={isVendorDialogOpen}
        onOpenChange={setIsVendorDialogOpen}
        onVendorAdded={handleVendorAdded}
      />
    </Dialog>
  );
};

export default InvoiceItemForm;
