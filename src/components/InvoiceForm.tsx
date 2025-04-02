
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import CustomerDialog from "@/components/CustomerDialog";
import VehicleDialog from "@/components/VehicleDialog";

import { InvoiceItem, Customer, Vehicle, Payment } from "@/types";
import { getCustomers } from "@/services/data-service";

// Import sub-components
import CustomerVehicleSelection from "@/components/invoice/CustomerVehicleSelection";
import InvoiceDetailsFields from "@/components/invoice/InvoiceDetailsFields";
import InvoiceItemsSection from "@/components/invoice/InvoiceItemsSection";
import PaymentsSection from "@/components/invoice/PaymentsSection";

// Invoice form schema
const invoiceFormSchema = z.object({
  customerId: z.string({ required_error: "Please select a customer" }),
  vehicleId: z.string({ required_error: "Please select a vehicle" }),
  date: z.date({ required_error: "Please select a date" }),
  status: z.enum(["open", "in-progress", "completed", "paid", "partial"] as const),
  notes: z.string().optional(),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  discountType: z.enum(["none", "percentage", "fixed"]).default("none"),
  discountValue: z.coerce.number().min(0).default(0),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

const InvoiceForm = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Initialize form
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      date: new Date(),
      status: "open",
      taxRate: 7.5, // Default tax rate
      discountType: "none",
      discountValue: 0,
    },
  });

  // Fetch customers
  useEffect(() => {
    const customersList = getCustomers();
    setCustomers(customersList);
  }, []);

  // Calculate subtotal (needed for discount calculations and passing to sub-components)
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  
  // Get current discount settings
  const discountType = form.watch("discountType");
  const discountValue = form.watch("discountValue");
  const taxRate = form.watch("taxRate");
  
  // Calculate discount
  let discountAmount = 0;
  if (discountType === "percentage" && discountValue > 0) {
    discountAmount = subtotal * (discountValue / 100);
  } else if (discountType === "fixed" && discountValue > 0) {
    discountAmount = discountValue;
  }
  
  // Calculate subtotal after discount
  const subtotalAfterDiscount = subtotal - discountAmount;
  
  // Calculate tax
  const tax = subtotalAfterDiscount * (taxRate / 100);
  
  // Calculate total
  const total = subtotalAfterDiscount + tax;

  // Handle new customer added
  const handleCustomerAdded = (newCustomer: Customer) => {
    setCustomers(prev => [...prev, newCustomer]);
    form.setValue("customerId", newCustomer.id);
    
    // Clear vehicle selection since the new customer has no vehicles
    form.setValue("vehicleId", "");
    setVehicles([]);
  };

  // Handle new vehicle added
  const handleVehicleAdded = (newVehicle: Vehicle) => {
    setVehicles(prev => [...prev, newVehicle]);
    form.setValue("vehicleId", newVehicle.id);
  };

  // Handle form submission
  const onSubmit = (data: InvoiceFormValues) => {
    if (items.length === 0) {
      toast.error("Please add at least one item to the invoice");
      return;
    }

    // Prepare invoice data
    const invoiceData = {
      ...data,
      items,
      payments,
      date: format(data.date, "yyyy-MM-dd"),
      dueDate: "", // No due date
    };

    // Add discount data if applicable
    if (data.discountType !== "none" && data.discountValue > 0) {
      // Fix: Create the discount object with the correct shape according to the Invoice type
      invoiceData.discount = {
        type: data.discountType === "percentage" ? "percentage" : "fixed",
        value: data.discountValue
      };
    }

    // Here you would normally save the invoice to your backend
    console.log("Invoice data:", invoiceData);
    
    toast.success("Invoice created successfully!");
    navigate("/invoices");
  };

  return (
    <div className="space-y-6">
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Customer and Vehicle Selection */}
          <CustomerVehicleSelection 
            customers={customers}
            vehicles={vehicles}
            setVehicles={setVehicles}
            setCustomerDialogOpen={setCustomerDialogOpen}
            setVehicleDialogOpen={setVehicleDialogOpen}
          />

          {/* Invoice Details */}
          <InvoiceDetailsFields />

          {/* Invoice Items */}
          <InvoiceItemsSection 
            items={items}
            setItems={setItems}
            subtotal={subtotal}
            discountType={discountType}
            discountValue={discountValue}
            taxRate={taxRate}
          />
          
          {/* Payments Section */}
          <PaymentsSection 
            payments={payments}
            setPayments={setPayments}
            total={total}
          />
          
          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional notes about this invoice"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate("/invoices")}
            >
              Cancel
            </Button>
            <Button type="submit">Create Invoice</Button>
          </div>
        </form>
      </FormProvider>

      {/* Customer Dialog */}
      <CustomerDialog 
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        onCustomerAdded={handleCustomerAdded}
      />

      {/* Vehicle Dialog */}
      <VehicleDialog
        open={vehicleDialogOpen}
        onOpenChange={setVehicleDialogOpen}
        customerId={form.watch("customerId")}
        onVehicleAdded={handleVehicleAdded}
      />
    </div>
  );
};

export default InvoiceForm;
