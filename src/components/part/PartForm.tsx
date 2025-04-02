
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { vendors, getInvoiceById } from "@/services/data-service";

const partSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  price: z.coerce.number().min(0.01, { message: "Price must be at least 0.01" }),
  quantity: z.coerce.number().min(0, { message: "Quantity cannot be negative" }),
  description: z.string().min(1, { message: "Description is required" }),
  vendorId: z.string().optional(),
  partNumber: z.string().optional(),
  reorderLevel: z.coerce.number().min(0).optional(),
});

export type PartFormValues = z.infer<typeof partSchema>;

interface PartFormProps {
  defaultValues?: PartFormValues;
  onSubmit: (data: PartFormValues) => void;
  formId: string;
  invoiceId?: string;
}

const PartForm = ({ defaultValues, onSubmit, formId, invoiceId }: PartFormProps) => {
  const invoice = invoiceId ? getInvoiceById(invoiceId) : undefined;
  
  const form = useForm<PartFormValues>({
    resolver: zodResolver(partSchema),
    defaultValues: defaultValues || {
      name: "",
      price: 0,
      quantity: 0,
      description: "",
      vendorId: "none",
      partNumber: "",
      reorderLevel: 10,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} id={formId} className="space-y-4">
        {invoice && (
          <div className="rounded-md bg-muted p-3 mb-4">
            <p className="text-sm font-medium">Adding part to invoice:</p>
            <p className="text-sm">
              Vehicle: {invoice.vehicleInfo.make} {invoice.vehicleInfo.model} ({invoice.vehicleInfo.year})
            </p>
            <p className="text-sm">License Plate: {invoice.vehicleInfo.licensePlate}</p>
          </div>
        )}
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Part Name</FormLabel>
              <FormControl>
                <Input placeholder="Oil Filter" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0.01" 
                    step="0.01" 
                    placeholder="10.99" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity in Stock</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="1" 
                    placeholder="100" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Part description" {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vendorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vendor</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value} 
                value={field.value || "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vendor (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="partNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Part Number</FormLabel>
                <FormControl>
                  <Input placeholder="Optional part number" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reorderLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reorder Level</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="1" 
                    placeholder="10" 
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
};

export default PartForm;
