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
import { Invoice, InvoiceItem, Vehicle } from "@/types";
import { 
  getCustomers, 
  getVehiclesByCustomerId,
  addInvoice,
  fetchVehicleById
} from "@/services/data-service";
import InvoiceItemsSection from "./invoice/InvoiceItemsSection";
import { toast } from "sonner";

// Define the form schema using Zod
const formSchema = z.object({
  customerId: z.string().min(1, { message: "Please select a customer." }),
  vehicleId: z.string().min(1, { message: "Please select a vehicle." }),
  date: z.string().min(1, { message: "Please select a date." }),
  taxRate: z.number().min(0, { message: "Tax rate must be at least 0." }).max(100, { message: "Tax rate cannot exceed 100." }),
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
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  
  // Fetch customers on component mount
  useEffect(() => {
    const loadCustomers = async () => {
      const fetchedCustomers = await getCustomers();
      setCustomers(fetchedCustomers);
    };
    
    loadCustomers();
  }, []);
  
  // Fetch vehicles when customer is selected
  useEffect(() => {
    const loadVehicles = async () => {
      if (selectedCustomerId) {
        const fetchedVehicles = await getVehiclesByCustomerId(selectedCustomerId);
        setVehicles(fetchedVehicles);
      }
    };
    
    loadVehicles();
  }, [selectedCustomerId]);
  
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

  // Calculate totals including discount
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = subtotal * (taxRate / 100);
    
    let discountAmount = 0;
    if (invoiceData?.discount) {
      if (invoiceData.discount.type === 'percentage') {
        discountAmount = subtotal * (invoiceData.discount.value / 100);
      } else {
        discountAmount = invoiceData.discount.value;
      }
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
      notes: invoiceData?.notes || "",
    },
  });

  const { handleSubmit } = form;

  const onSubmit = async () => {
    try {
      // Prepare invoice data for submission
      const invoiceData = {
        customerId: selectedCustomerId,
        vehicleId: selectedVehicleId,
        date: date,
        taxRate: taxRate,
        notes: notes,
        items: items
      };
      
      // Call the addInvoice function from data-service
      await addInvoice(invoiceData);
      
      toast.success("Invoice created successfully!");
      navigate("/invoices");
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice. Please try again.");
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

        {/* Invoice Items */}
        <InvoiceItemsSection
          items={items}
          onItemsChange={setItems}
        />

        {/* Tax Rate */}
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
