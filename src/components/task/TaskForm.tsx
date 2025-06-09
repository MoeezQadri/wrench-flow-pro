
import React, { useState, useEffect } from "react";
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
import { Task, TaskLocation } from "@/types";
import { useDataContext } from "@/context/data/DataContext";

const taskSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  status: z.enum(["pending", "in-progress", "completed"]),
  price: z.coerce.number().min(0, { message: "Price must be 0 or greater" }),
  location: z.enum(["workshop", "onsite", "remote"]),
  vehicleId: z.string().optional(),
  mechanicId: z.string().optional(),
  invoiceId: z.string().optional(),
  hoursEstimated: z.coerce.number().min(0, { message: "Hours must be 0 or greater" }),
  hoursSpent: z.coerce.number().min(0, { message: "Hours must be 0 or greater" }),
});

export type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  defaultValues?: Partial<TaskFormValues>;
  onSubmit: (data: TaskFormValues) => void;
  formId: string;
  task?: Task;
}

const TaskForm = ({ defaultValues, onSubmit, formId, task }: TaskFormProps) => {
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const {
    mechanics: mechanics_, customers: customers_, invoices: invoices_,
    getVehiclesByCustomerId,
  } = useDataContext();
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      status: "pending",
      price: 0,
      location: "workshop",
      vehicleId: "",
      mechanicId: "",
      invoiceId: "",
      hoursEstimated: 0,
      hoursSpent: 0,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      setMechanics(mechanics_);
      setCustomers(customers_);
      setInvoices(invoices_);
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadVehicles = async () => {
      if (selectedCustomer) {
        const vehiclesData = await getVehiclesByCustomerId(selectedCustomer);
        setVehicles(vehiclesData);
      } else {
        setVehicles([]);
      }
    };

    loadVehicles();
  }, [selectedCustomer]);

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
                <Textarea placeholder="Task description" {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
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
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                    min="0"
                    step="0.01"
                    placeholder="50.00"
                    {...field}
                  />
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
                <FormLabel>Assigned Mechanic</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mechanic" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {mechanics.map((mechanic) => (
                      <SelectItem key={mechanic.id} value={mechanic.id}>
                        {mechanic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="hoursEstimated"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Hours</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="2.0"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hoursSpent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hours Spent</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="1.5"
                    {...field}
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

export default TaskForm;
