
import React, { useEffect, useState } from "react";
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
import { 
  getMechanics, 
  getInvoices, 
  getVehicleById, 
  getCustomerById, 
  vendors, 
  getVehiclesByCustomerId
} from "@/services/data-service";
import { Task, TaskLocation, Vehicle } from "@/types";

const taskSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  mechanicId: z.string().min(1, { message: "Please select a mechanic" }),
  status: z.enum(["pending", "in-progress", "completed"]),
  hoursEstimated: z.coerce.number().min(0.1, { message: "Estimated hours must be at least 0.1" }),
  hoursSpent: z.coerce.number().optional(),
  invoiceId: z.string().optional(),
  vehicleId: z.string().optional(),
  location: z.enum(["workshop", "onsite", "remote"]).default("workshop"),
  price: z.coerce.number().optional(),
});

export type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  defaultValues?: TaskFormValues;
  onSubmit: (data: TaskFormValues) => void;
  formId: string;
  userRole: string;
}

const TaskForm = ({ defaultValues, onSubmit, formId, userRole }: TaskFormProps) => {
  const [activeMechanics, setActiveMechanics] = useState<any[]>([]);
  const [availableInvoices, setAvailableInvoices] = useState<any[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | undefined>(defaultValues?.invoiceId);
  
  useEffect(() => {
    const loadData = async () => {
      // Load mechanics
      const mechanicsData = await getMechanics();
      setActiveMechanics(mechanicsData.filter(m => m.isActive));
      
      // Load invoices (open or in-progress only)
      const invoicesData = await getInvoices();
      
      // Process invoices to include vehicle and customer info
      const processedInvoices = invoicesData
        .filter(invoice => invoice.status === 'open' || invoice.status === 'in-progress')
        .map(invoice => {
          return {
            ...invoice,
            vehicleInfo: invoice.vehicleInfo
          };
        });
        
      setAvailableInvoices(processedInvoices);

      // Load all vehicles (for direct vehicle selection)
      const customers = await getCustomers();
      const vehiclesList: Vehicle[] = [];
      
      // Gather all vehicles from all customers
      for (const customer of customers) {
        const customerVehicles = getVehiclesByCustomerId(customer.id);
        if (customerVehicles.length > 0) {
          vehiclesList.push(...customerVehicles);
        }
      }
      
      setAvailableVehicles(vehiclesList);
    };
    
    loadData();
  }, []);
  
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      mechanicId: "",
      status: "pending",
      hoursEstimated: 1,
      hoursSpent: undefined,
      invoiceId: undefined,
      vehicleId: undefined,
      location: "workshop",
      price: undefined,
    },
  });

  const status = form.watch("status");
  const invoiceId = form.watch("invoiceId");
  
  // Update vehicle selection when invoice is selected
  useEffect(() => {
    if (invoiceId && invoiceId !== "none") {
      const selectedInvoice = availableInvoices.find(inv => inv.id === invoiceId);
      if (selectedInvoice) {
        form.setValue("vehicleId", selectedInvoice.vehicleId);
      }
    }
  }, [invoiceId, availableInvoices, form]);
  
  // Format invoice option with vehicle details
  const formatInvoiceOption = (invoice: any) => {
    if (!invoice.vehicleInfo) {
      return `${invoice.id.substring(0, 8)}...`;
    }
    
    return `${invoice.id.substring(0, 8)}... - ${invoice.vehicleInfo.make} ${invoice.vehicleInfo.model}`;
  };

  // Format vehicle option
  const formatVehicleOption = (vehicle: Vehicle) => {
    return `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`;
  };

  // Determine if the invoice selection should be shown
  // Available to managers, owners, and foremen
  const canSelectInvoice = userRole === 'manager' || userRole === 'owner' || userRole === 'foreman';
  const canSetPrice = (userRole === 'manager' || userRole === 'owner') && status === 'completed';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} id={formId} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Title</FormLabel>
              <FormControl>
                <Input placeholder="Oil Change" {...field} />
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
                <Textarea placeholder="Detailed task description" {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mechanicId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {userRole === 'foreman' ? 'Assign to Mechanic' : 'Assigned Mechanic'}
              </FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value} 
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a mechanic" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {activeMechanics.map((mechanic) => (
                    <SelectItem key={mechanic.id} value={mechanic.id}>
                      {mechanic.name} - {mechanic.specialization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="onsite">Onsite</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="hoursEstimated"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Hours</FormLabel>
                <FormControl>
                  <Input type="number" min="0.1" step="0.1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {(status === "completed" || status === "in-progress") && (
            <FormField
              control={form.control}
              name="hoursSpent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hours Spent {status === "in-progress" ? "(so far)" : ""}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0.1" 
                      step="0.1" 
                      placeholder="Actual hours spent"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Vehicle selection - for all authorized roles */}
        <FormField
          control={form.control}
          name="vehicleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value || "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vehicle (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Not linked to a vehicle</SelectItem>
                  {availableVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {formatVehicleOption(vehicle)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Invoice selection - only for managers, owners, and foremen */}
        {canSelectInvoice && (
          <FormField
            control={form.control}
            name="invoiceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link to Invoice</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedInvoiceId(value !== "none" ? value : undefined);
                  }} 
                  value={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an invoice (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Not linked to an invoice</SelectItem>
                    {availableInvoices.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.id.substring(0, 8)}... - {invoice.vehicleInfo.make} {invoice.vehicleInfo.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Price field - only shown for completed tasks when user has proper permissions */}
        {canSetPrice && (
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Price ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    min="0" 
                    step="0.01" 
                    placeholder="Enter price for this task"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </form>
    </Form>
  );
};

export default TaskForm;
