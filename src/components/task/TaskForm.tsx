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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Task } from "@/types";
import { useDataContext } from "@/context/data/DataContext";

const taskSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  status: z.enum(["in-progress", "completed"]), // Remove pending and open
  price: z.coerce.number().min(0, { message: "Price must be 0 or greater" }),
  taskType: z.enum(["invoice", "internal"]),
  vehicleId: z.string().optional(),
  mechanicId: z.string().optional(),
  invoiceId: z.string().optional(),
  hoursEstimated: z.coerce.number().min(0, { message: "Hours must be 0 or greater" }),
  hoursSpent: z.coerce.number().min(0, { message: "Hours must be 0 or greater" }),
}).refine((data) => {
  // If task type is invoice, require invoiceId
  if (data.taskType === "invoice" && !data.invoiceId) {
    return false;
  }
  return true;
}, {
  message: "Invalid task configuration",
  path: ["taskType"]
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
  const [activeInvoices, setActiveInvoices] = useState<any[]>([]);
  const [isLoadingMechanics, setIsLoadingMechanics] = useState(true);
  const [mechanicsError, setMechanicsError] = useState<string | null>(null);
  
  const {
    mechanics: mechanics_, customers: customers_, invoices: invoices_,
    getVehiclesByCustomerId, loadMechanics,
  } = useDataContext();
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      status: "in-progress", // Changed default from pending
      price: 0,
      
      taskType: "internal",
      vehicleId: "",
      mechanicId: "",
      invoiceId: "",
      hoursEstimated: 0,
      hoursSpent: 0,
    },
  });

  const watchTaskType = form.watch("taskType");
  const watchInvoiceId = form.watch("invoiceId");

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingMechanics(true);
        setMechanicsError(null);
        
        // Ensure mechanics are loaded if they're empty
        if (mechanics_.length === 0) {
          console.log("Loading mechanics in TaskForm...");
          await loadMechanics();
        }
        
        setMechanics(mechanics_);
        setCustomers(customers_);
        setInvoices(invoices_);
        
        // Filter for active invoices only (open, in-progress)
        const activeInvoicesList = invoices_.filter(invoice => 
          invoice.status === 'open' || invoice.status === 'in-progress'
        );
        setActiveInvoices(activeInvoicesList);
        
        console.log("TaskForm data loaded:", {
          mechanics: mechanics_.length,
          customers: customers_.length,
          invoices: invoices_.length,
          activeInvoices: activeInvoicesList.length
        });
        
      } catch (error) {
        console.error("Error loading TaskForm data:", error);
        setMechanicsError("Failed to load mechanics");
      } finally {
        setIsLoadingMechanics(false);
      }
    };

    loadData();
  }, [mechanics_, customers_, invoices_, loadMechanics]);

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

  // When task type changes, clear invoice selection
  useEffect(() => {
    if (watchTaskType === "internal") {
      form.setValue("invoiceId", "");
      form.setValue("vehicleId", "");
      setSelectedCustomer("");
    }
  }, [watchTaskType, form]);

  // When invoice changes, update vehicle selection
  useEffect(() => {
    if (watchInvoiceId && watchTaskType === "invoice") {
      const selectedInvoice = activeInvoices.find(inv => inv.id === watchInvoiceId);
      if (selectedInvoice) {
        form.setValue("vehicleId", selectedInvoice.vehicle_id);
        // Find customer for this invoice to populate customer selector
        const vehicle = vehicles.find(v => v.id === selectedInvoice.vehicle_id);
        if (vehicle) {
          setSelectedCustomer(vehicle.customer_id);
        }
      }
    }
  }, [watchInvoiceId, watchTaskType, activeInvoices, vehicles, form]);

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

        <FormField
          control={form.control}
          name="taskType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Type</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex flex-row space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="invoice" id="invoice" />
                    <Label htmlFor="invoice">Invoice Task</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="internal" id="internal" />
                    <Label htmlFor="internal">Internal Workshop Task</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchTaskType === "invoice" && (
          <FormField
            control={form.control}
            name="invoiceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Active Invoice *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an active invoice" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {activeInvoices.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        Invoice #{invoice.id.slice(0, 8)}... ({invoice.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
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
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingMechanics}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue 
                        placeholder={
                          isLoadingMechanics 
                            ? "Loading mechanics..." 
                            : mechanicsError 
                            ? "Error loading mechanics" 
                            : mechanics.length === 0 
                            ? "No mechanics available" 
                            : "Select mechanic"
                        } 
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="unassigned">None</SelectItem>
                    {mechanics.length === 0 && !isLoadingMechanics && !mechanicsError && (
                      <SelectItem value="no-mechanics" disabled>No mechanics available</SelectItem>
                    )}
                    {mechanics.map((mechanic) => (
                      <SelectItem key={mechanic.id} value={mechanic.id}>
                        {mechanic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {mechanicsError && (
                  <p className="text-sm text-red-600">{mechanicsError}</p>
                )}
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

        {watchTaskType === "internal" && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Internal Workshop Task:</strong> This task will be assigned to the workshop for internal operations and maintenance.
            </p>
          </div>
        )}
      </form>
    </Form>
  );
};

export default TaskForm;
