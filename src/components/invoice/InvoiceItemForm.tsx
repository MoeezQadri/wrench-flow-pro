import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { InvoiceItem, Part, Task } from "@/types";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  type: z.enum(["part", "labor", "other"]),
  quantity: z.coerce.number().min(0.01, "Quantity must be at least 0.01"),
  price: z.coerce.number().min(0, "Price must be at least 0"),
  part_id: z.string().optional(),
  task_id: z.string().optional(),
  unit_of_measure: z.string().optional(),
  creates_inventory_part: z.boolean().optional(),
  creates_task: z.boolean().optional(),
  // Custom part fields
  part_number: z.string().optional(),
  manufacturer: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  // Custom labor fields
  labor_rate: z.coerce.number().min(0).optional(),
  skill_level: z.string().optional(),
});

type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>;

interface InvoiceItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: InvoiceItem) => void;
  availableParts: Part[];
  availableTasks: Task[];
  vehicleId: string;
  editingItem?: InvoiceItem | null;
}

const InvoiceItemForm: React.FC<InvoiceItemFormProps> = ({
  open,
  onOpenChange,
  onSave,
  availableParts,
  availableTasks,
  vehicleId,
  editingItem
}) => {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const form = useForm<InvoiceItemFormData>({
    resolver: zodResolver(invoiceItemSchema),
    defaultValues: {
      description: "",
      type: "other",
      quantity: 1,
      price: 0,
      part_id: "",
      task_id: "",
      unit_of_measure: "piece",
      creates_inventory_part: false,
      creates_task: false,
      part_number: "",
      manufacturer: "",
      category: "",
      location: "",
      labor_rate: 50.00,
      skill_level: "standard",
    },
  });

  const watchedType = form.watch("type");

  useEffect(() => {
    if (editingItem) {
      console.log('Editing item:', editingItem);
      
      // Parse custom data if it exists
      const customPartData = editingItem.custom_part_data || {};
      const customLaborData = editingItem.custom_labor_data || {};
      
      form.reset({
        description: editingItem.description,
        type: editingItem.type,
        quantity: editingItem.quantity,
        price: editingItem.price,
        part_id: editingItem.part_id || "",
        task_id: editingItem.task_id || "",
        unit_of_measure: editingItem.unit_of_measure || "piece",
        creates_inventory_part: editingItem.creates_inventory_part || false,
        creates_task: editingItem.creates_task || false,
        // Custom part fields
        part_number: customPartData.part_number || "",
        manufacturer: customPartData.manufacturer || "",
        category: customPartData.category || "",
        location: customPartData.location || "",
        // Custom labor fields
        labor_rate: customLaborData.labor_rate || 50.00,
        skill_level: customLaborData.skill_level || "standard",
      });
      
      // Show advanced options if editing and has custom data
      if (Object.keys(customPartData).length > 0 || Object.keys(customLaborData).length > 0) {
        setShowAdvancedOptions(true);
      }
    } else {
      form.reset({
        description: "",
        type: "other",
        quantity: 1,
        price: 0,
        part_id: "",
        task_id: "",
        unit_of_measure: "piece",
        creates_inventory_part: false,
        creates_task: false,
        part_number: "",
        manufacturer: "",
        category: "",
        location: "",
        labor_rate: 50.00,
        skill_level: "standard",
      });
      setShowAdvancedOptions(false);
    }
  }, [editingItem, form, open]);

  const handleSubmit = (data: InvoiceItemFormData) => {
    console.log("InvoiceItemForm submit called with:", data);
    
    // Build custom data objects
    const customPartData: any = {};
    const customLaborData: any = {};
    
    if (data.type === "part") {
      if (data.part_number) customPartData.part_number = data.part_number;
      if (data.manufacturer) customPartData.manufacturer = data.manufacturer;
      if (data.category) customPartData.category = data.category;
      if (data.location) customPartData.location = data.location;
    }
    
    if (data.type === "labor") {
      if (data.labor_rate) customLaborData.labor_rate = data.labor_rate;
      if (data.skill_level) customLaborData.skill_level = data.skill_level;
    }

    const item: InvoiceItem = {
      id: editingItem?.id || `item-${Date.now()}`,
      description: data.description,
      type: data.type,
      quantity: data.quantity,
      price: data.price,
      part_id: data.part_id && data.part_id !== "custom" ? data.part_id : undefined,
      task_id: data.task_id && data.task_id !== "custom" ? data.task_id : undefined,
      unit_of_measure: data.unit_of_measure || "piece",
      creates_inventory_part: data.creates_inventory_part || false,
      creates_task: data.creates_task || false,
      custom_part_data: Object.keys(customPartData).length > 0 ? customPartData : undefined,
      custom_labor_data: Object.keys(customLaborData).length > 0 ? customLaborData : undefined,
      is_auto_added: false,
    };

    console.log('Saving item:', item);
    onSave(item);
    form.reset();
    setShowAdvancedOptions(false);
  };

  const handlePartSelect = (partId: string) => {
    console.log('Part selected:', partId);
    if (partId === "custom") {
      // Clear fields for custom part
      form.setValue("description", "");
      form.setValue("price", 0);
      form.setValue("unit_of_measure", "piece");
      return;
    }
    
    const part = availableParts.find(p => p.id === partId);
    if (part) {
      console.log('Found part:', part);
      form.setValue("description", part.name);
      form.setValue("price", part.price);
      form.setValue("unit_of_measure", part.unit || "piece");
      
      // Populate custom fields if available
      if (part.part_number) form.setValue("part_number", part.part_number);
      if (part.manufacturer) form.setValue("manufacturer", part.manufacturer);
      if (part.category) form.setValue("category", part.category);
      if (part.location) form.setValue("location", part.location);
    }
  };

  const handleTaskSelect = (taskId: string) => {
    console.log('Task selected:', taskId);
    if (taskId === "custom") {
      // Clear fields for custom task
      form.setValue("description", "");
      form.setValue("price", 0);
      form.setValue("quantity", 1);
      form.setValue("unit_of_measure", "hour");
      return;
    }
    
    const task = availableTasks.find(t => t.id === taskId);
    if (task) {
      console.log('Found task:', task);
      form.setValue("description", task.title);
      form.setValue("price", task.price || 0);
      form.setValue("quantity", task.hoursEstimated || 1);
      form.setValue("unit_of_measure", "hour");
      
      // Populate custom labor fields if available
      if (task.labor_rate) form.setValue("labor_rate", task.labor_rate);
      if (task.skill_level) form.setValue("skill_level", task.skill_level);
    }
  };

  const handleCancel = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    console.log("Cancel button clicked");
    form.reset();
    setShowAdvancedOptions(false);
    onOpenChange(false);
  };

  // Filter available parts - exclude those already assigned to other invoices
  const filteredParts = availableParts.filter(part => 
    !part.invoice_ids || part.invoice_ids.length === 0
  );

  // Filter available tasks - exclude those already assigned to invoices
  const filteredTasks = availableTasks.filter(task => 
    task.status === 'completed' && !task.invoiceId
  );

  console.log('Available parts for custom items:', filteredParts);
  console.log('Available tasks for custom items:', filteredTasks);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Edit Invoice Item" : "Add Custom Invoice Item"}
          </DialogTitle>
          <DialogDescription>
            Add a custom item or select from available parts and tasks.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="part">Parts</SelectItem>
                      <SelectItem value="labor">Labor</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedType === "part" && (
              <FormField
                control={form.control}
                name="part_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Part (Optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value) handlePartSelect(value);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose from available parts" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="custom">Custom Part (no inventory link)</SelectItem>
                        {filteredParts.map((part) => (
                          <SelectItem key={part.id} value={part.id}>
                            {part.name} - ${part.price.toFixed(2)} (Stock: {part.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchedType === "labor" && (
              <FormField
                control={form.control}
                name="task_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Task (Optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value) handleTaskSelect(value);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose from available tasks" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="custom">Custom Labor (no task link)</SelectItem>
                        {filteredTasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.title} - ${(task.price || 0).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Item description" 
                      {...field} 
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="1"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_of_measure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="piece">Piece</SelectItem>
                        <SelectItem value="hour">Hour</SelectItem>
                        <SelectItem value="set">Set</SelectItem>
                        <SelectItem value="gallon">Gallon</SelectItem>
                        <SelectItem value="liter">Liter</SelectItem>
                        <SelectItem value="meter">Meter</SelectItem>
                        <SelectItem value="foot">Foot</SelectItem>
                        <SelectItem value="kg">Kilogram</SelectItem>
                        <SelectItem value="lb">Pound</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Advanced Options Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="advanced-options"
                checked={showAdvancedOptions}
                onCheckedChange={(checked) => setShowAdvancedOptions(checked === true)}
              />
              <label htmlFor="advanced-options" className="text-sm font-medium">
                Show advanced options
              </label>
            </div>

            {/* Advanced Options */}
            {showAdvancedOptions && (
              <div className="space-y-4 border-t pt-4">
                {watchedType === "part" && (
                  <>
                    <h4 className="font-medium text-sm">Part Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="part_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Part Number</FormLabel>
                            <FormControl>
                              <Input placeholder="ABC123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="manufacturer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Manufacturer</FormLabel>
                            <FormControl>
                              <Input placeholder="Acme Corp" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input placeholder="Engine Parts" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Storage Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Shelf A-1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="creates_inventory_part"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => field.onChange(checked === true)}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Create inventory part
                            </FormLabel>
                            <FormDescription>
                              Add this custom part to your parts inventory for future use
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {watchedType === "labor" && (
                  <>
                    <h4 className="font-medium text-sm">Labor Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="labor_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Labor Rate ($/hour)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="50.00"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="skill_level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Skill Level</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select skill level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                                <SelectItem value="expert">Expert</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="creates_task"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => field.onChange(checked === true)}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Create task template
                            </FormLabel>
                            <FormDescription>
                              Save this custom labor as a task template for future use
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingItem ? "Update" : "Add"} Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceItemForm;
