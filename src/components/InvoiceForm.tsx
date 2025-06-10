import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
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
import { Invoice, InvoiceItem, Vehicle, Part, Task, TaskLocation, InvoiceStatus, Payment } from "@/types";

import InvoiceItemsSection from "./invoice/InvoiceItemsSection";
import PaymentsSection from "./invoice/PaymentsSection";
import CustomerVehicleSelection from "./invoice/CustomerVehicleSelection";
import { toast } from "sonner";
import { useDataContext } from "@/context/data/DataContext";
import { createInvoiceWithAutoAssignment, getAssignedPartsForInvoice, getAssignedTasksForInvoice, updateInvoice } from "@/services/supabase-service";
import { createTestCustomers } from "@/utils/test-data-helper";

interface InvoiceFormProps {
  isEditing?: boolean;
  invoiceData?: Invoice | null;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ isEditing = false, invoiceData = null }) => {
  const navigate = useNavigate();
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<InvoiceStatus>('open');
  const [taxRate, setTaxRate] = useState(7.5);
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [assignedParts, setAssignedParts] = useState<Part[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [showAutoItems, setShowAutoItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  
  // Add a ref to track if initial data has been loaded to prevent conflicts
  const initialDataLoaded = useRef(false);

  // Initialize react-hook-form for PaymentsSection
  const form = useForm({
    defaultValues: {
      status: 'open' as InvoiceStatus
    }
  });

  const {
    customers,
    parts,
    tasks,
    loadInvoices,
    updateInvoice: updateInvoiceInContext,
  } = useDataContext();

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

  // Initialize form values when editing - only run once and before other effects
  useEffect(() => {
    if (invoiceData && !initialDataLoaded.current) {
      console.log("Initializing form with invoice data:", invoiceData);
      setSelectedCustomerId(invoiceData.customer_id);
      setSelectedVehicleId(invoiceData.vehicle_id);
      setDate(invoiceData.date);
      setStatus(invoiceData.status);
      setTaxRate(invoiceData.tax_rate || 7.5);
      setDiscountType(invoiceData.discount_type || 'none');
      setDiscountValue(invoiceData.discount_value || 0);
      setNotes(invoiceData.notes || "");
      setItems(invoiceData.items || []);
      setPayments(invoiceData.payments || []);
      initialDataLoaded.current = true;
    }
  }, [invoiceData]);

  // Load assigned parts and tasks when vehicle is selected - but ONLY for new invoices
  useEffect(() => {
    const loadAssignedItems = async () => {
      // Only load assigned items for new invoices, not when editing
      if (selectedVehicleId && selectedCustomerId && !isEditing && initialDataLoaded.current === false) {
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
    
    setItems(prev => {
      console.log('Adding auto-assigned items:', autoItems);
      const updated = [...prev, ...autoItems];
      console.log('Items after adding auto items:', updated);
      return updated;
    });
    setShowAutoItems(false);
    toast.success('Auto-assigned items added to invoice');
  };

  // Update the form status when status state changes
  useEffect(() => {
    form.setValue('status', status);
  }, [status, form]);

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

  // Validate form before submission
  const validateForm = () => {
    const errors: string[] = [];

    if (!selectedCustomerId) {
      errors.push("Please select a customer");
    }
    if (!selectedVehicleId) {
      errors.push("Please select a vehicle");
    }
    if (!date) {
      errors.push("Please select a date");
    }
    if (items.length === 0) {
      errors.push("Please add at least one item to the invoice");
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleCreateTestData = async () => {
    await createTestCustomers();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submission started");
    console.log("Form data:", {
      customerId: selectedCustomerId,
      vehicleId: selectedVehicleId,
      date,
      status,
      taxRate,
      items: items.length,
      payments: payments.length,
      isEditing
    });

    // Validate form
    if (!validateForm()) {
      console.log("Form validation failed:", formErrors);
      toast.error("Please fix the form errors before submitting");
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (isEditing && invoiceData) {
        console.log("Updating existing invoice:", invoiceData.id);
        
        const updatedInvoiceData = {
          id: invoiceData.id,
          customer_id: selectedCustomerId,
          vehicle_id: selectedVehicleId,
          date: date,
          status: status,
          tax_rate: taxRate,
          discount_type: discountType,
          discount_value: discountValue,
          notes: notes,
          items: items,
          payments: payments
        };

        console.log("Calling updateInvoice with:", updatedInvoiceData);
        await updateInvoice(updatedInvoiceData);
        
        // Also update in context
        if (updateInvoiceInContext) {
          await updateInvoiceInContext(updatedInvoiceData.id, updatedInvoiceData);
        }
        
        // Reload invoices to ensure data consistency
        if (loadInvoices) {
          await loadInvoices();
        }
        
        toast.success("Invoice updated successfully!");
      } else {
        console.log("Creating new invoice");
        const invoiceCreationData = {
          customerId: selectedCustomerId,
          vehicleId: selectedVehicleId,
          date: date,
          taxRate: taxRate,
          discountType: discountType,
          discountValue: discountValue,
          notes: notes,
          items: items.filter(item => !item.is_auto_added)
        };

        console.log("Calling createInvoiceWithAutoAssignment with:", invoiceCreationData);
        await createInvoiceWithAutoAssignment(invoiceCreationData);
        
        if (loadInvoices) {
          await loadInvoices();
        }
        
        const manualItems = items.filter(item => !item.is_auto_added);
        const autoItems = items.filter(item => item.is_auto_added);
        
        let successMessage = "Invoice created successfully!";
        if (autoItems.length > 0) {
          successMessage += ` ${autoItems.length} items auto-assigned.`;
        }
        if (manualItems.length > 0) {
          successMessage += ` ${manualItems.length} manual items synced to inventory.`;
        }
        
        toast.success(successMessage);
      }

      console.log("Invoice saved successfully, navigating to invoices page");
      navigate("/invoices");
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to save invoice. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced items change handler to prevent conflicts
  const handleItemsChange = (newItems: InvoiceItem[] | ((prev: InvoiceItem[]) => InvoiceItem[])) => {
    console.log('handleItemsChange called with:', typeof newItems === 'function' ? 'function' : newItems);
    setItems(prevItems => {
      const result = typeof newItems === 'function' ? newItems(prevItems) : newItems;
      console.log('Items state updated from:', prevItems, 'to:', result);
      return result;
    });
  };

  return (
    <FormProvider {...form}>
      <div>
        {/* Show form errors if any */}
        {formErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Please fix the following errors:</h4>
            <ul className="list-disc list-inside text-red-700 text-sm">
              {formErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Show helper for empty customers */}
        {customers.length === 0 && !isEditing && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">No Customers Found</h3>
                <p className="text-sm text-blue-700">
                  You need customers to create invoices. Create some test data to get started.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleCreateTestData}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Create Test Data
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer and Vehicle Selection */}
          <CustomerVehicleSelection
            selectedCustomerId={selectedCustomerId}
            onCustomerIdChange={setSelectedCustomerId}
            selectedVehicleId={selectedVehicleId}
            onVehicleIdChange={setSelectedVehicleId}
            isEditing={isEditing}
          />

          {/* Date */}
          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Status Selection - Only show when editing */}
          {isEditing && (
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: InvoiceStatus) => setStatus(value)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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
            onItemsChange={handleItemsChange}
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

          {/* Payments Section - Only show when editing */}
          {isEditing && (
            <PaymentsSection
              payments={payments}
              setPayments={setPayments}
              total={totals.total}
            />
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : (isEditing ? "Update Invoice" : "Create Invoice")}
          </Button>
        </form>
      </div>
    </FormProvider>
  );
};

export default InvoiceForm;
