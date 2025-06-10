
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataContext } from '@/context/data/DataContext';
import { Customer } from "@/types";

const vehicleFormSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().min(4, "Year must be at least 4 characters"),
  license_plate: z.string().min(1, "License plate is required"),
  vin: z.string().optional(),
  color: z.string().optional(),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

interface VehicleFormSectionProps {
  onSubmit: (data: VehicleFormValues) => void;
  formId: string;
  defaultValues?: VehicleFormValues;
  preselectedCustomerId?: string;
}

const VehicleFormSection = ({ onSubmit, formId, defaultValues, preselectedCustomerId }: VehicleFormSectionProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const { customers: customers_ } = useDataContext();

  useEffect(() => {
    setCustomers(customers_);
  }, [customers_]);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: defaultValues || {
      customer_id: preselectedCustomerId || "",
      make: "",
      model: "",
      year: "",
      license_plate: "",
      vin: "",
      color: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} id={formId} className="space-y-4">
        <FormField
          control={form.control}
          name="customer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer *</FormLabel>
              <Select 
                value={field.value} 
                onValueChange={field.onChange}
                disabled={!!preselectedCustomerId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
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
            name="make"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Make</FormLabel>
                <FormControl>
                  <Input placeholder="Toyota" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input placeholder="Camry" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <FormControl>
                  <Input placeholder="2023" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="license_plate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License Plate</FormLabel>
                <FormControl>
                  <Input placeholder="ABC-1234" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>VIN (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="1HGBH41JXMN109186" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Blue" {...field} />
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

export default VehicleFormSection;
