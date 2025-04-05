
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
import { getMechanics, getInvoices, getVehicleById, getCustomerById } from "@/services/data-service";

const taskSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  mechanicId: z.string().min(1, { message: "Please select a mechanic" }),
  status: z.enum(["pending", "in-progress", "completed"]),
  hoursEstimated: z.coerce.number().min(0.1, { message: "Estimated hours must be at least 0.1" }),
  hoursSpent: z.coerce.number().optional(),
  invoiceId: z.string().optional(),
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
  
  useEffect(() => {
    const loadData = async () => {
      // Load mechanics
      const mechanicsData = await getMechanics();
      setActiveMechanics(mechanicsData.filter(m => m.isActive));
      
      // Load invoices (open or in-progress only)
      const invoicesData = await getInvoices();
      setAvailableInvoices(invoicesData.filter(
        invoice => invoice.status === 'open' || invoice.status === 'in-progress'
      ));
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
    },
  });

  const status = form.watch("status");
  
  // Format invoice option with vehicle and customer details
  const formatInvoiceOption = (invoice: any) => {
    const vehicle = getVehicleById(invoice.vehicleId);
    const customer = getCustomerById(invoice.customerId);
    
    if (!vehicle || !customer) {
      return `${invoice.id.substring(0, 8)}...`;
    }
    
    return `${invoice.id.substring(0, 8)}... - ${vehicle.make} ${vehicle.model} (${customer.name})`;
  };

  // Determine if the invoice selection should be shown
  // Available to managers, owners, and foremen
  const canSelectInvoice = userRole === 'manager' || userRole === 'owner' || userRole === 'foreman';

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

        {/* Invoice selection - only for managers, owners, and foremen */}
        {canSelectInvoice && (
          <FormField
            control={form.control}
            name="invoiceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link to Invoice/Vehicle</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
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
      </form>
    </Form>
  );
};

export default TaskForm;
