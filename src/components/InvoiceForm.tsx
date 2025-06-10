import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Invoice, InvoiceItem, Vehicle, Part, Task, TaskLocation } from "@/types";

import InvoiceItemsSection from "./invoice/InvoiceItemsSection";
import { toast } from "sonner";
import { useDataContext } from "@/context/data/DataContext";
import { createInvoiceWithAutoAssignment, getAssignedPartsForInvoice, getAssignedTasksForInvoice } from "@/services/supabase-service";

// Define the form schema using Zod
const formSchema = z.object({
  customerId: z.string().min(1, { message: "Please select a customer." }),
  vehicleId: z.string().min(1, { message: "Please select a vehicle." }),
  date: z.string().min(1, { message: "Please select a date." }),
  taxRate: z.number().min(0, { message: "Tax rate must be at least 0." }).max(100, { message: "Tax rate cannot exceed 100." }),
  discountType: z.enum(['none', 'percentage', 'fixed']).default('none'),
  discountValue: z.number().min(0).default(0),
  notes: z.string().optional(),
});

// Define the form values type based on the schema
export type InvoiceFormValues = z.infer<typeof formSchema>;

interface InvoiceFormProps {
  isEditing?: boolean;
  invoiceData?: Invoice | null;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ isEditing = false, invoiceData = null }) => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [taxRate, setTaxRate] = useState(7.5);
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [assignedParts, setAssignedParts] = useState<Part[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [showAutoItems, setShowAutoItems] = useState(false);

  const {
    getVehiclesByCustomerId,
    addInvoice,
    customers: customersData,
    parts,
    tasks
  } = useDataContext();

  // Fetch customers on component mount
  useEffect(() => {
    setCustomers(customersData);
  }, [customersData]);

  // Fetch parts and tasks - only show completed items
  useEffect(() => {
    // Get available parts (those not assigned to any invoice or assigned to current invoice if editing)
    const availableParts = parts.filter(part => 
      !part.invoice_ids || 
      part.invoice_ids.length === 0 || 
      (isEditing && part.invoice_ids.includes(invoiceData?.id || ''))
    );
    setAvailableParts(availableParts);

    // Get available tasks - only completed tasks (those not assigned to any invoice or assigned to current invoice if editing)
    const availableTasks = tasks.filter(task => 
      task.status === 'completed' && (
        !task.invoiceId || 
        (isEditing && task.invoiceId === invoiceData?.id)
      )
    );
    setAvailableTasks(availableTasks);
  }, [parts, tasks, isEditing, invoiceData]);

  // Fetch vehicles when customer is selected
  useEffect(() => {
    const loadVehicles = async () => {
      if (selectedCustomerId) {
        const fetchedVehicles = await getVehiclesByCustomerId(selectedCustomerId);
        setVehicles(fetchedVehicles);
      }
    };

    loadVehicles();
  }, [selectedCustomerId, getVehiclesByCustomerId]);

  // Initialize form values when editing
  useEffect(() => {
    if (invoiceData) {
      setSelectedCustomerId(invoiceData.customer_id);
      setSelectedVehicleId(invoiceData.vehicle_id);
      setDate(invoiceData.date);
      setTaxRate(invoiceData.tax_rate || 7.5);
      setNotes(invoiceData.notes || "");
      setItems(invoiceData.items);
    }
  }, [invoiceData]);

  // Load assigned parts and tasks when vehicle is selected
  useEffect(() => {
    const loadAssignedItems = async () => {
      if (selectedVehicleId && selectedCustomerId && !isEditing) {
        try {
          const [assignedPartsData, assignedTasksData] = await Promise.all([
            getAssignedPartsForInvoice(selectedVehicleId, selectedCustomerId),
            getAssignedTasksForInvoice(selectedVehicleId)
          ]);
          
          setAssignedParts(assignedPartsData);
          
          // Map the data to match the Task interface and filter for completed tasks only
          const mappedTasks: Task[] = assignedTasksData
            .filter(task => task.status === 'completed')
            .map(task => ({
              id: task.id,
              title: task.title,
              description: task.description,
              mechanicId: task.mechanic_id,
              vehicleId: selectedVehicleId,
              status: task.status,
              location: (task.location as TaskLocation) || 'workshop',
              hoursEstimated: task.hours_estimated,
              hoursSpent: task.hours_spent,
              price: task.price,
              invoiceId: task.invoice_id
            }));
          
          setAssignedTasks(mappedTasks);
          
          // Show notification if there are auto-assignable items
          if (assignedPartsData.length > 0 || mappedTasks.length > 0) {
            setShowAutoItems(true);
            toast.success(`Found ${assignedPartsData.length} assigned parts and ${mappedTasks.length} completed tasks that will be automatically added to this invoice.`);
          }
        } catch (error) {
          console.error('Error loading assigned items:', error);
        }
      }
    };

    loadAssignedItems();
  }, [selectedVehicleId, selectedCustomerId, isEditing]);

  // Add auto-assigned items to the invoice items list
  const addAutoAssignedItems = () => {
    const autoItems: InvoiceItem[] = [];
    
    // Add assigned parts
    assignedParts.forEach(part => {
      autoItems.push({
        id: `auto-part-${part.id}`,
        description: part.name,
        type: 'parts',
        quantity: 1,
        price: part.price,
        part_id: part.id,
        is_auto_added: true
      });
    });
    
    // Add assigned completed tasks
    assignedTasks.forEach(task => {
      autoItems.push({
        id: `auto-task-${task.id}`,
        description: task.title,
        type: 'labor',
        quantity: task.hoursEstimated || 1,
        price: task.price || 0,
        task_id: task.id,
        is_auto_added: true
      });
    });
    
    setItems(prev => [...prev, ...autoItems]);
    setShowAutoItems(false);
    toast.success('Auto-assigned items added to invoice');
  };

  // Calculate totals including discount
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = subtotal * (taxRate / 100);

    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = subtotal * (discountValue / 100);
    } else if (discountType === 'fixed') {
      discountAmount = discountValue;
    }

    const total = subtotal + taxAmount - discountAmount;

    return {
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total
    };
  };

  const totals = calculateTotals();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: invoiceData?.customer_id || "",
      vehicleId: invoiceData?.vehicle_id || "",
      date: invoiceData?.date || new Date().toISOString().slice(0, 10),
      taxRate: invoiceData?.tax_rate || 7.5,
      discountType: invoiceData?.discount_type || 'none',
      discountValue: invoiceData?.discount_value || 0,
      notes: invoiceData?.notes || "",
    },
  });

  const { handleSubmit } = form;

  const onSubmit = async () => {
    try {
      if (isEditing) {
        // Handle editing logic (existing functionality)
        const invoiceData = {
          customerId: selectedCustomerId,
          vehicleId: selectedVehicleId,
          date: date,
          taxRate: taxRate,
          discountType: discountType,
          discountValue: discountValue,
          notes: notes,
          items: items
        };

        await addInvoice(invoiceData);
        toast.success("Invoice updated successfully!");
      } else {
        // Handle new invoice creation with auto-assignment
        const invoiceData = {
          customerId: selectedCustomerId,
          vehicleId: selectedVehicleId,
          date: date,
          taxRate: taxRate,
          discountType: discountType,
          discountValue: discountValue,
          notes: notes,
          items: items.filter(item => !item.is_auto_added) // Only manual items, auto items handled by service
        };

        await createInvoiceWithAutoAssignment(invoiceData);
        toast.success("Invoice created successfully with automatic assignments!");
      }

      navigate("/invoices");
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to save invoice. Please try again.");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Customer Selection */}
        <div>
          <Label htmlFor="customer">Customer</Label>
          <Select value={selectedCustomerId} onValueChange={(value) => setSelectedCustomerId(value)} required>
            <SelectTrigger id="customer">
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer: any) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Vehicle Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="vehicle">Vehicle</Label>
            <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId} required>
              <SelectTrigger id="vehicle">
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Show auto-assignment notification */}
        {showAutoItems && !isEditing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">Automatic Assignment Available</h3>
                <p className="text-sm text-blue-700">
                  Found {assignedParts.length} assigned parts and {assignedTasks.length} completed tasks for this vehicle.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAutoItems(false)}
                >
                  Skip
                </Button>
                <Button
                  type="button"
                  onClick={addAutoAssignedItems}
                >
                  Add Auto Items
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Items */}
        <InvoiceItemsSection
          items={items}
          onItemsChange={setItems}
          availableParts={availableParts}
          availableTasks={availableTasks}
          vehicleId={selectedVehicleId}
        />

        {/* Tax Rate and Discount */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <Label htmlFor="discountType">Discount Type</Label>
            <Select value={discountType} onValueChange={(value: 'none' | 'percentage' | 'fixed') => setDiscountType(value)}>
              <SelectTrigger id="discountType">
                <SelectValue placeholder="Select discount type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Discount</SelectItem>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
                <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {discountType !== 'none' && (
            <div>
              <Label htmlFor="discountValue">
                {discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount ($)'}
              </Label>
              <Input
                id="discountValue"
                type="number"
                step="0.01"
                min="0"
                max={discountType === 'percentage' ? "100" : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes for this invoice..."
          />
        </div>

        {/* Totals */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-${totals.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax ({taxRate}%):</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full">
          {isEditing ? "Update Invoice" : "Create Invoice"}
        </Button>
      </form>
    </div>
  );
};

export default InvoiceForm;
