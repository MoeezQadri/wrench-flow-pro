
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole, TaskLocation } from "@/types";
import { 
  getMechanics, 
  getInvoices, 
  getCurrentUser,
  hasPermission,
  getCustomers
} from "@/services/data-service";

// Define the form schema
const taskFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters long" }),
  description: z.string().optional(),
  mechanicId: z.string().min(1, { message: "Please select a mechanic" }),
  status: z.enum(["pending", "in-progress", "completed"]),
  hoursEstimated: z.coerce.number().min(0.1, { message: "Please enter estimated hours" }),
  hoursSpent: z.coerce.number().optional(),
  invoiceId: z.string().optional(),
  vehicleId: z.string().optional(),
  location: z.enum(["workshop", "onsite", "remote"]),
  price: z.coerce.number().optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  defaultValues?: TaskFormValues;
  onSubmit: (values: TaskFormValues) => void;
  formId: string;
  userRole: UserRole;
}

const TaskForm: React.FC<TaskFormProps> = ({ defaultValues, onSubmit, formId, userRole }) => {
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      mechanicId: "",
      status: "pending",
      hoursEstimated: 1,
      hoursSpent: 0,
      invoiceId: "none",
      vehicleId: "none",
      location: "workshop",
      price: undefined,
    },
  });

  // Check which fields the user can edit based on role
  const currentUser = getCurrentUser();
  const canEditMechanic = hasPermission(currentUser, 'mechanics', 'manage') || userRole === 'foreman';
  const canEditPrice = hasPermission(currentUser, 'invoices', 'manage') || userRole === 'manager' || userRole === 'owner';

  // Load mechanics and invoices when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load mechanics
        const mechanicsData = await getMechanics();
        setMechanics(mechanicsData);
        
        // Load invoices only for managers and owners who can edit prices
        if (canEditPrice) {
          const invoicesData = await getInvoices();
          setInvoices(invoicesData);
        }
        
        // Load vehicles
        const allCustomers = await getCustomers();
        const allVehicles = allCustomers.flatMap(customer => 
          (customer.vehicles || []).map(vehicle => ({
            ...vehicle,
            customerName: customer.name
          }))
        );
        setVehicles(allVehicles);
        
      } catch (error) {
        console.error("Error loading form data:", error);
        toast.error("Failed to load form data");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [canEditPrice]);

  const handleSubmit = (values: TaskFormValues) => {
    if (values.invoiceId === "none") {
      values.invoiceId = undefined;
    }
    
    if (values.vehicleId === "none") {
      values.vehicleId = undefined;
    }
    
    onSubmit(values);
  };

  if (isLoading) {
    return <div className="flex justify-center py-4">Loading...</div>;
  }

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Title</FormLabel>
              <FormControl>
                <Input placeholder="Oil Change, Brake Repair, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter detailed task description..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mechanic Selection */}
          <FormField
            control={form.control}
            name="mechanicId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign Mechanic</FormLabel>
                <Select
                  disabled={!canEditMechanic && !form.formState.defaultValues?.mechanicId}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a mechanic" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mechanics
                      .filter((mechanic) => mechanic.isActive)
                      .map((mechanic) => (
                        <SelectItem key={mechanic.id} value={mechanic.id}>
                          {mechanic.name} - {mechanic.specialization || "General"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status Selection */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Hours Estimated */}
          <FormField
            control={form.control}
            name="hoursEstimated"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Hours</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Hours Spent */}
          <FormField
            control={form.control}
            name="hoursSpent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hours Spent</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Leave blank if task not started
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Price */}
          {canEditPrice && (
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Price (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      value={field.value || ""}
                      placeholder="Default: hours × rate"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vehicle Selection */}
          <FormField
            control={form.control}
            name="vehicleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vehicle (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.customerName}: {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Associate this task with a specific vehicle
                </FormDescription>
              </FormItem>
            )}
          />

          {/* Location Selection */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="onsite">Onsite</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Where the work will be performed
                </FormDescription>
              </FormItem>
            )}
          />
        </div>

        {/* Invoice Selection */}
        {canEditPrice && (
          <FormField
            control={form.control}
            name="invoiceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Link to invoice (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectGroup>
                      <SelectLabel>Open Invoices</SelectLabel>
                      {invoices
                        .filter(inv => inv.status === 'open' || inv.status === 'in-progress')
                        .map(invoice => (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            #{invoice.id.substring(0, 8)} - {invoice.vehicleInfo.make} {invoice.vehicleInfo.model}
                          </SelectItem>
                        ))
                      }
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Link this task to an invoice
                </FormDescription>
              </FormItem>
            )}
          />
        )}
      </form>
    </Form>
  );
};

export default TaskForm;
