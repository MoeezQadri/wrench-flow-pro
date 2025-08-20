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
import { Checkbox } from "@/components/ui/checkbox";
import { InvoiceItem, Part, Task, Vendor, Expense } from "@/types";
import { useDataContext } from "@/context/data/DataContext";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import VendorDialog from "@/components/part/VendorDialog";
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
  const [unitOfMeasure, setUnitOfMeasure] = useState("piece");
  const [selectedPartId, setSelectedPartId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  
  // Custom creation flags
  const [createsTask, setCreatesTask] = useState(false);
  
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
  const [skillLevel, setSkillLevel] = useState("standard");

  const { mechanics, vendors, addPart, addTask, addExpense } = useDataContext();
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
        setUnitOfMeasure(editingItem.unit_of_measure || "piece");
        setSelectedPartId(editingItem.part_id || "");
        setSelectedTaskId(editingItem.task_id || "");
        
        setCreatesTask(editingItem.creates_task || false);
        
        // Populate custom data if available
        if (editingItem.custom_part_data) {
          setPartNumber(editingItem.custom_part_data.part_number || "");
          setManufacturer(editingItem.custom_part_data.manufacturer || "");
          setCategory(editingItem.custom_part_data.category || "");
          setLocation(editingItem.custom_part_data.location || "");
        }
        
        if (editingItem.custom_labor_data) {
          setLaborRate(editingItem.custom_labor_data.labor_rate || 50);
          setSkillLevel(editingItem.custom_labor_data.skill_level || "standard");
        }
      } else {
        // Reset form for new item
        setDescription("");
        setPartName("");
        setType('part');
        setQuantity(1);
        setPrice(0);
        setUnitOfMeasure("piece");
        setSelectedPartId("");
        setSelectedTaskId("");
        
        setCreatesTask(false);
        setPartNumber("");
        setManufacturer("");
        setCategory("");
        setLocation("");
        setLaborRate(50);
        setSkillLevel("standard");
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
        setPrice(selectedPart.price);
        setUnitOfMeasure(selectedPart.unit || "piece");
      }
    }
  }, [selectedPartId, availableParts]);

  useEffect(() => {
    if (selectedTaskId && availableTasks) {
      const selectedTask = availableTasks.find(t => t.id === selectedTaskId);
      if (selectedTask) {
        setDescription(selectedTask.title);
        setPrice(selectedTask.price || 0);
        setQuantity(selectedTask.hoursEstimated || 1);
        setUnitOfMeasure("hour");
      }
    }
  }, [selectedTaskId, availableTasks]);

  const handleSave = async () => {
    // Validate required fields based on type
    if (type === 'part' && !partName.trim()) {
      alert('Please enter a part name.');
      return;
    } else if (type !== 'part' && !description.trim()) {
      alert('Please enter a description.');
      return;
    }

    // Validate vendor selection for parts (always required for parts since we removed part selection)
    if (type === 'part' && !selectedVendorId) {
      alert('Please select a vendor for the part.');
      return;
    }

    const itemDescription = type === 'part' ? partName.trim() : description.trim();

    const newItem: InvoiceItem = {
      id: editingItem?.id || `item-${Date.now()}`,
      description: itemDescription,
      type,
      quantity,
      price,
      unit_of_measure: unitOfMeasure,
      part_id: selectedPartId || undefined,
      task_id: selectedTaskId || undefined,
      creates_inventory_part: type === 'part' || type === 'other',
      creates_task: createsTask,
      is_auto_added: false
    };

    // Handle custom part creation - always save to database for parts (since we removed part selection)
    if (type === 'part' && addPart && invoiceId) {
      try {
        const customPart: Part = {
          id: crypto.randomUUID(),
          name: partName.trim(),
          description: description.trim() || `Custom part created from invoice ${invoiceId.substring(0, 8)}`,
          price,
          quantity: 0, // Start with 0 since it's being used immediately
          part_number: partNumber || undefined,
          manufacturer: manufacturer || undefined,
          category: category || undefined,
          location: location || undefined,
          vendor_id: selectedVendorId,
          vendor_name: vendors.find((v: Vendor) => v.id === selectedVendorId)?.name,
          invoice_ids: [invoiceId],
          reorder_level: 5,
          unit: unitOfMeasure,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const savedPart = await addPart(customPart);
        newItem.part_id = savedPart.id;
        newItem.custom_part_data = {
          part_number: partNumber,
          manufacturer: manufacturer,
          category: category,
          location: location
        };
        
        // Create expense for part purchase
        const vendor = vendors.find((v: Vendor) => v.id === selectedVendorId);
        const expense: Expense = {
          id: crypto.randomUUID(),
          category: 'parts',
          description: `Invoice ${invoiceId.substring(0, 8)}: ${partName.trim()}`,
          amount: price * quantity,
          date: new Date().toISOString(),
          vendor_id: selectedVendorId,
          vendor_name: vendor?.name,
          payment_method: "cash",
          payment_status: "paid",
          invoice_id: invoiceId,
        };
        
        try {
          await addExpense(expense);
        } catch (error) {
          console.error("Error creating expense for part purchase:", error);
        }
        console.log('Created custom part in database:', savedPart);
      } catch (error) {
        console.error('Failed to create custom part:', error);
        // Still proceed with invoice item creation
      }
    }

    // Handle custom other item creation - always save to database
    if (type === 'other' && !selectedPartId && addPart && invoiceId) {
      try {
        const customPart: Part = {
          id: crypto.randomUUID(),
          name: description.trim(),
          description: `Custom item created from invoice ${invoiceId.substring(0, 8)}`,
          price,
          quantity: 0, // Start with 0 since it's being used immediately
          part_number: partNumber || undefined,
          manufacturer: manufacturer || undefined,
          category: 'other',
          location: location || undefined,
          vendor_id: selectedVendorId || undefined,
          vendor_name: selectedVendorId ? vendors.find((v: Vendor) => v.id === selectedVendorId)?.name : undefined,
          invoice_ids: [invoiceId],
          reorder_level: 5,
          unit: unitOfMeasure,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const savedPart = await addPart(customPart);
        newItem.part_id = savedPart.id;
        newItem.custom_part_data = {
          part_number: partNumber,
          manufacturer: manufacturer,
          category: category,
          location: location
        };
        
        // Create expense for other item purchase if vendor is selected
        if (selectedVendorId) {
          const vendor = vendors.find((v: Vendor) => v.id === selectedVendorId);
          const expense: Expense = {
            id: crypto.randomUUID(),
            category: 'other',
            description: `Invoice ${invoiceId.substring(0, 8)}: ${description.trim()}`,
            amount: price * quantity,
            date: new Date().toISOString(),
            vendor_id: selectedVendorId,
            vendor_name: vendor?.name,
            payment_method: "cash",
            payment_status: "paid",
            invoice_id: invoiceId,
          };
          
          try {
            await addExpense(expense);
          } catch (error) {
            console.error("Error creating expense for item purchase:", error);
          }
        }
        console.log('Created custom other item in database:', savedPart);
      } catch (error) {
        console.error('Failed to create custom other item:', error);
        // Still proceed with invoice item creation
      }
    }

    // Handle custom task creation - save to database if creating task
    if (createsTask && type === 'labor' && addTask && invoiceId) {
      try {
        const customTask: Task = {
          id: crypto.randomUUID(),
          title: description.trim(),
          description: `Custom labor task created from invoice ${invoiceId.substring(0, 8)}`,
          mechanicId: undefined,
          vehicleId: vehicleId,
          status: 'completed', // Mark as completed since it's being invoiced
          location: 'workshop',
          hoursEstimated: quantity,
          hoursSpent: quantity,
          price: price * quantity,
          invoiceId: invoiceId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await addTask(customTask);
        newItem.task_id = customTask.id;
        newItem.custom_labor_data = {
          labor_rate: laborRate,
          skill_level: skillLevel
        };
        console.log('Created custom task in database:', customTask);
      } catch (error) {
        console.error('Failed to create custom task:', error);
        // Still proceed with invoice item creation
      }
    } else if (type === 'labor' && !selectedTaskId) {
      // For custom labor not being saved as task
      newItem.custom_labor_data = {
        labor_rate: laborRate,
        skill_level: skillLevel
      };
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

          {/* Part Name for parts, Description for others */}
          {type === 'part' ? (
            <div>
              <Label htmlFor="partName">Part Name *</Label>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                required
              />
            </div>
            <div>
              <Label htmlFor="price">Unit Price ({getCurrencySymbol()}) *</Label>
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
          {type === 'part' && (
            <div className="space-y-4 border-t pt-4">
              <div className="text-sm text-muted-foreground">
                This part will be automatically saved to the parts database and linked to this invoice.
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

          {/* Custom Task Creation */}
          {type === 'labor' && !selectedTaskId && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createsTask"
                  checked={createsTask}
                  onCheckedChange={(checked) => setCreatesTask(checked as boolean)}
                />
                <Label htmlFor="createsTask" className="text-sm">
                  Save to tasks database {invoiceId ? `(tagged with this invoice)` : '(no invoice ID available)'}
                </Label>
              </div>

              {createsTask && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted p-4 rounded-lg">
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
                  <div>
                    <Label htmlFor="skillLevel">Skill Level</Label>
                    <Select value={skillLevel} onValueChange={setSkillLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
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
