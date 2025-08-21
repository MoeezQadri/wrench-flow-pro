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
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';

import InvoiceItemsSection from "./invoice/InvoiceItemsSection";
import PaymentsSection from "./invoice/PaymentsSection";
import CustomerVehicleSelection from "./invoice/CustomerVehicleSelection";
import { deduplicateItems, mergeItemQuantities } from "./invoice/InvoiceItemDeduplication";
import { toast } from "sonner";
import { useDataContext } from "@/context/data/DataContext";
import { getAssignedPartsForInvoice, getAssignedTasksForInvoice } from "@/services/supabase-service";
import { createInvoiceOptimized } from "@/services/optimized-invoice-service";
import { createTestCustomers } from "@/utils/test-data-helper";
import { useOptimizedInvoiceEdit } from "@/hooks/useOptimizedInvoiceEdit";
import { useSmartDataLoading } from "@/hooks/useSmartDataLoading";

interface InvoiceFormProps {
  isEditing?: boolean;
  invoiceData?: Invoice | null;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ isEditing = false, invoiceData = null }) => {
  const navigate = useNavigate();
  const { formatCurrency, getCurrencySymbol } = useOrganizationSettings();
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
  
  // Add refs to track state and prevent unnecessary reinitializations
  const initialDataLoaded = useRef(false);
  const userHasChangedForm = useRef(false);
  const submissionLock = useRef(false);
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use optimized hooks for invoice editing and data loading
  const { updateInvoice: updateInvoiceWithHook, isSubmitting: isInvoiceSubmitting } = useOptimizedInvoiceEdit();
  const { smartLoad, isLoaded } = useSmartDataLoading();

  // Initialize react-hook-form with proper default values
  const form = useForm({
    defaultValues: {
      status: 'open' as InvoiceStatus,
      discountType: 'none' as 'none' | 'percentage' | 'fixed',
      discountValue: 0,
      taxRate: 7.5,
      date: new Date(),
      invoiceId: invoiceData?.id || null
    }
  });

  const {
    customers,
    parts,
    tasks,
    mechanics,
    loadInvoices,
    updateInvoice: updateInvoiceInContext,
    addInvoice,
    loadMechanics,
    loadTasks,
    loadParts,
  } = useDataContext();

  // Debug logging for data availability
  useEffect(() => {
    console.log('InvoiceForm data debug:', {
      mechanics: mechanics?.length || 0,
      tasks: tasks?.length || 0,
      parts: parts?.length || 0,
      mechanicsData: mechanics?.slice(0, 2),
      tasksData: tasks?.slice(0, 2),
      partsData: parts?.slice(0, 2)
    });
  }, [mechanics, tasks, parts]);

  // Smart data loading - only load what's needed
  useEffect(() => {
    const loadAllData = async () => {
      console.log('Smart loading data for invoice form...');
      try {
        const loadPromises = [];
        
        if (!isLoaded('mechanics') && loadMechanics) {
          loadPromises.push(smartLoad('mechanics', loadMechanics));
        }
        
        if (!isLoaded('tasks') && loadTasks) {
          loadPromises.push(smartLoad('tasks', loadTasks));
        }
        
        if (!isLoaded('parts') && loadParts) {
          loadPromises.push(smartLoad('parts', loadParts));
        }
        
        if (loadPromises.length > 0) {
          console.log('Loading missing data:', loadPromises.length, 'items');
          await Promise.all(loadPromises);
        } else {
          console.log('All data already loaded, skipping');
        }
        
        console.log('Smart data loading completed');
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadAllData();
  }, [loadMechanics, loadTasks, loadParts, smartLoad, isLoaded]);

  // Fetch parts and tasks - separate workshop parts from invoice-assigned parts
  useEffect(() => {
    console.log('Parts filtering debug:', {
      totalParts: parts?.length || 0,
      isEditing,
      invoiceId: invoiceData?.id
    });
    
    if (parts && parts.length > 0) {
      parts.forEach((part, index) => {
        console.log(`Part ${index}:`, {
          id: part.id,
          name: part.name,
          invoice_ids: part.invoice_ids,
          quantity: part.quantity
        });
      });

      // Workshop parts: parts that are available in inventory
      // OR parts assigned to the current invoice being edited
      const workshopParts = parts.filter(part => {
        // If editing, include parts already assigned to this specific invoice
        if (isEditing && part.invoice_ids && part.invoice_ids.includes(invoiceData?.id || '')) {
          return true;
        }
        
        // Workshop parts: have inventory quantity (regardless of previous assignments)
        const hasInventory = part.quantity > 0;
        
        return hasInventory;
      });
      
      console.log('Workshop parts (available for selection):', {
        count: workshopParts.length,
        parts: workshopParts.map(p => ({ 
          id: p.id, 
          name: p.name, 
          invoice_ids: p.invoice_ids,
          quantity: p.quantity 
        }))
      });
      
      setAvailableParts(workshopParts);

      // Invoice-assigned parts: parts specifically tagged to this invoice (for auto-assignment)
      const invoiceAssignedParts = parts.filter(part => 
        part.invoice_ids && 
        part.invoice_ids.includes(invoiceData?.id || selectedVehicleId) && 
        !isEditing
      );
      
      console.log('Invoice-assigned parts (for auto-assignment):', {
        count: invoiceAssignedParts.length,
        parts: invoiceAssignedParts.map(p => ({ 
          id: p.id, 
          name: p.name, 
          invoice_ids: p.invoice_ids 
        }))
      });

      setAssignedParts(invoiceAssignedParts);
    }
  }, [parts, isEditing, invoiceData, selectedVehicleId]);

  // Filter available tasks
  useEffect(() => {
    console.log('Tasks filtering debug:', {
      totalTasks: tasks?.length || 0,
      tasksData: tasks?.slice(0, 3).map(t => ({ 
        id: t.id, 
        title: t.title, 
        status: t.status,
        invoiceId: t.invoiceId 
      }))
    });

    if (tasks && tasks.length > 0) {
      const availableTasksFiltered = tasks.filter(task => 
        task.status === 'completed' && (
          !task.invoiceId || 
          (isEditing && task.invoiceId === invoiceData?.id)
        )
      );
      
      console.log('Filtered available tasks:', {
        count: availableTasksFiltered.length,
        tasks: availableTasksFiltered.map(t => ({ id: t.id, title: t.title, invoiceId: t.invoiceId }))
      });
      
      setAvailableTasks(availableTasksFiltered);
    }
  }, [tasks, isEditing, invoiceData]);

  // Initialize form values when editing - only initialize once or when invoice ID changes
  useEffect(() => {
    if (invoiceData && (!initialDataLoaded.current || !userHasChangedForm.current)) {
      console.log("Initializing form with invoice data:", invoiceData);
      console.log("Raw invoice date:", invoiceData.date);
      console.log("User has changed form:", userHasChangedForm.current);
      
      setSelectedCustomerId(invoiceData.customer_id);
      setSelectedVehicleId(invoiceData.vehicle_id);
      
      // Handle date more safely
      let formattedDate;
      if (invoiceData.date) {
        // If it's already a date string in YYYY-MM-DD format, use it directly
        if (typeof invoiceData.date === 'string' && invoiceData.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          formattedDate = invoiceData.date;
        } else {
          // Otherwise, extract date part
          formattedDate = invoiceData.date.toString().split('T')[0];
        }
      } else {
        formattedDate = new Date().toISOString().slice(0, 10);
      }
      
      console.log("Formatted date for form:", formattedDate);
      setDate(formattedDate);
      
      setStatus(invoiceData.status);
      setTaxRate(invoiceData.tax_rate || 7.5);
      setDiscountType(invoiceData.discount_type || 'none');
      setDiscountValue(invoiceData.discount_value || 0);
      setNotes(invoiceData.notes || "");
      setItems(invoiceData.items || []);
      setPayments(invoiceData.payments || []);
      
      // Set the invoice ID in the form for PaymentsSection
      form.setValue('invoiceId', invoiceData.id);
      initialDataLoaded.current = true;
    }
  }, [invoiceData?.id]); // Only depend on invoice ID to prevent form reinitialization

  // Load assigned parts and tasks - skip auto-assignment for editing invoices
  useEffect(() => {
    const loadAssignedItems = async () => {
      if (selectedVehicleId && selectedCustomerId && !isEditing) {
        try {
          // Only load auto-assignments for NEW invoices
          const [assignedPartsData, assignedTasksData] = await Promise.all([
            getAssignedPartsForInvoice(selectedVehicleId, selectedCustomerId),
            getAssignedTasksForInvoice(selectedVehicleId)
          ]);
          
          setAssignedParts(assignedPartsData);
          
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

  // Helper function to check if item already exists to prevent duplicates
  const isDuplicateItem = (newItem: InvoiceItem, existingItems: InvoiceItem[]) => {
    return existingItems.some(item => 
      (item.part_id && newItem.part_id && item.part_id === newItem.part_id) ||
      (item.task_id && newItem.task_id && item.task_id === newItem.task_id) ||
      (item.description === newItem.description && item.type === newItem.type)
    );
  };

  // Add auto-assigned items to the invoice items list
  const addAutoAssignedItems = () => {
    if (isEditing) {
      toast.info('Auto-assignment is not available when editing invoices');
      return;
    }

    const autoItems: InvoiceItem[] = [];
    
    assignedParts.forEach(part => {
      const newItem = {
        id: `auto-part-${part.id}`,
        description: part.name,
        type: 'part' as const,
        quantity: 1,
        price: part.price,
        part_id: part.id,
        is_auto_added: true
      };
      
      if (!isDuplicateItem(newItem, items)) {
        autoItems.push(newItem);
      }
    });
    
    assignedTasks.forEach(task => {
      const newItem = {
        id: `auto-task-${task.id}`,
        description: task.title,
        type: 'labor' as const,
        quantity: task.hoursEstimated || 1,
        price: task.price || 0,
        task_id: task.id,
        is_auto_added: true
      };
      
      if (!isDuplicateItem(newItem, items)) {
        autoItems.push(newItem);
      }
    });
    
    if (autoItems.length === 0) {
      toast.info('All items are already added to the invoice');
      setShowAutoItems(false);
      return;
    }
    
    setItems(prev => {
      console.log('Adding auto-assigned items:', autoItems);
      const updated = [...prev, ...autoItems];
      console.log('Items after adding auto items:', updated);
      return updated;
    });
    setShowAutoItems(false);
    toast.success(`${autoItems.length} auto-assigned items added to invoice`);
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

    // Validate each item
    items.forEach((item, index) => {
      if (!item.description) {
        errors.push(`Item ${index + 1}: Description is required`);
      }
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (item.price < 0) {
        errors.push(`Item ${index + 1}: Price cannot be negative`);
      }
    });

    // Check for zero amount invoice when items exist
    if (items.length > 0) {
      const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      if (totalAmount === 0) {
        errors.push("Invoice cannot have zero total when items are present. Please check item prices.");
      }
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleCreateTestData = async () => {
    await createTestCustomers();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Main form submission started - handleSubmit called");
    
    // Robust duplicate submission prevention
    if (submissionLock.current || isSubmitting || isInvoiceSubmitting) {
      console.log("Form is already being submitted, ignoring duplicate submission");
      return;
    }

    // Validate form first
    if (!validateForm()) {
      console.log("Form validation failed:", formErrors);
      toast.error("Please fix the form errors before submitting");
      return;
    }

    // Set submission lock and state
    submissionLock.current = true;
    setIsSubmitting(true);

    // Set timeout to prevent infinite loading
    submissionTimeoutRef.current = setTimeout(() => {
      if (submissionLock.current) {
        console.error("Invoice submission timed out");
        toast.error("Invoice submission timed out. Please try again.");
        submissionLock.current = false;
        setIsSubmitting(false);
      }
    }, 30000); // 30 second timeout
    
    try {
      if (isEditing && invoiceData) {
        console.log("Updating existing invoice:", invoiceData.id);
        console.log("Current form state:", { selectedCustomerId, selectedVehicleId, date, status, taxRate, discountType, discountValue, notes, items });
        
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

        console.log("INVOICE_FORM: Updating invoice data:", updatedInvoiceData);
        
        // Remove payments from invoice data - they're handled separately
        const { payments: _, ...invoiceDataWithoutPayments } = updatedInvoiceData;
        
        const result = await updateInvoiceWithHook(invoiceDataWithoutPayments as Invoice);
        
        if (result) {
          console.log("Invoice update result:", result);
          
          // Reset user change tracking after successful save
          userHasChangedForm.current = false;
          
          // Force reload invoices to get fresh data
          if (loadInvoices) {
            console.log("Reloading invoices after update");
            await loadInvoices();
          }
          
          console.log("Invoice updated successfully, navigating to invoices page");
          navigate("/invoices");
        }
      } else {
        console.log("Creating new invoice");
        console.log("Items before sending:", items);
        
        console.log("Items before deduplication:", items);
        
        // Clone items array to prevent reference issues during submission
        const clonedItems = JSON.parse(JSON.stringify(items));
        
        // Deduplicate and merge items before creating invoice
        const deduplicatedItems = deduplicateItems(clonedItems);
        const mergedItems = mergeItemQuantities(deduplicatedItems);
        
        console.log("Items after deduplication and merging:", mergedItems);

        // Final validation before creation
        if (mergedItems.length === 0) {
          throw new Error("No valid items to add to invoice");
        }

        const totalAmount = mergedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        if (totalAmount === 0) {
          throw new Error("Cannot create invoice with zero total amount");
        }

        const invoiceCreationData = {
          customerId: selectedCustomerId,
          vehicleId: selectedVehicleId,
          date: date,
          taxRate: taxRate,
          discountType: discountType,
          discountValue: discountValue,
          notes: notes,
          items: mergedItems
        };

        console.log("Calling optimized invoice creation with:", invoiceCreationData);
        
        // Show progress indication
        toast.loading("Creating invoice...", { id: "invoice-creation" });
        
        const createdInvoice = await createInvoiceOptimized(invoiceCreationData);
        
        // Dismiss loading toast
        toast.dismiss("invoice-creation");
        
        if (!createdInvoice) {
          throw new Error("Invoice creation returned no data");
        }
        
        console.log("Invoice created successfully:", createdInvoice);
        toast.success("Invoice created successfully!");
        
        // Reset form tracking
        userHasChangedForm.current = false;
        
        navigate("/invoices");
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      console.error("Error details:", error.message);
      toast.error(`Failed to save invoice: ${error.message}`);
      
      // Rollback any partial state changes if needed
      if (!isEditing) {
        // For new invoices, we can reset form state on error
        console.log("Rolling back form state due to error");
      }
    } finally {
      // Clear submission lock and state
      submissionLock.current = false;
      setIsSubmitting(false);
      
      // Clear timeout
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current);
        submissionTimeoutRef.current = null;
      }
    }
  };

  // Enhanced items change handler to prevent conflicts
  const handleItemsChange = (newItems: InvoiceItem[] | ((prev: InvoiceItem[]) => InvoiceItem[])) => {
    console.log('handleItemsChange called with:', typeof newItems === 'function' ? 'function' : newItems);
    userHasChangedForm.current = true; // Track that user has made changes
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
            vehicleInfo={invoiceData?.vehicleInfo ? {
              make: invoiceData.vehicleInfo.make,
              model: invoiceData.vehicleInfo.model,
              year: invoiceData.vehicleInfo.year, // Keep as string
              license_plate: invoiceData.vehicleInfo.license_plate
            } : undefined}
          />

          {/* Date */}
          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => {
                console.log("Date input changed to:", e.target.value);
                setDate(e.target.value);
                userHasChangedForm.current = true;
              }}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Current date value: {date}</p>
          </div>

          {/* Status Selection - Only show when editing */}
          {isEditing && (
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={status || 'open'} 
                onValueChange={(value: InvoiceStatus) => {
                  console.log('Status changing to:', value);
                  setStatus(value);
                  userHasChangedForm.current = true;
                }}
              >
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
            invoiceId={invoiceData?.id}
            formatCurrency={formatCurrency}
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
                onChange={(e) => {
                  setTaxRate(parseFloat(e.target.value) || 0);
                  userHasChangedForm.current = true;
                }}
              />
            </div>

            <div>
              <Label htmlFor="discountType">Discount Type</Label>
              <Select 
                value={discountType || 'none'} 
                onValueChange={(value: 'none' | 'percentage' | 'fixed') => {
                  console.log('Discount type changing to:', value);
                  setDiscountType(value);
                  userHasChangedForm.current = true;
                }}
              >
                <SelectTrigger id="discountType">
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Discount</SelectItem>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount ({getCurrencySymbol()})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {discountType !== 'none' && (
              <div>
                <Label htmlFor="discountValue">
                  {discountType === 'percentage' ? 'Discount Percentage (%)' : `Discount Amount (${getCurrencySymbol()})`}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  step="0.01"
                  min="0"
                  max={discountType === 'percentage' ? "100" : undefined}
                  value={discountValue}
                  onChange={(e) => {
                    setDiscountValue(parseFloat(e.target.value) || 0);
                    userHasChangedForm.current = true;
                  }}
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
              onChange={(e) => {
                setNotes(e.target.value);
                userHasChangedForm.current = true;
              }}
              placeholder="Additional notes for this invoice..."
            />
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(totals.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax ({taxRate}%):</span>
                <span>{formatCurrency(totals.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>

          {/* Payments Section - Only show when editing */}
          {isEditing && (
            <PaymentsSection
              payments={payments}
              setPayments={setPayments}
              total={totals.total}
              invoiceId={invoiceData?.id}
            />
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || isInvoiceSubmitting || submissionLock.current}
          >
            {isSubmitting || isInvoiceSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEditing ? "Update Invoice" : "Create Invoice"
            )}
          </Button>
        </form>
      </div>
    </FormProvider>
  );
};

export default InvoiceForm;
