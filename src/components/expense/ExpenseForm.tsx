
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
import { Button } from "@/components/ui/button";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Vendor } from "@/types";
import VendorDialog from "./VendorDialog";
import { useDataContext } from "@/context/data/DataContext";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";

const expenseSchema = z.object({
  date: z.date(),
  category: z.string().min(1, { message: "Category is required" }),
  amount: z.coerce.number().min(0.01, { message: "Amount must be at least 0.01" }),
  description: z.string().min(1, { message: "Description is required" }),
  paymentMethod: z.enum(["cash", "card", "bank-transfer", "check", "other"]),
  expenseType: z.enum(["invoice", "workshop"]),
  vendorId: z.string().optional(),
  invoiceId: z.string().optional(),
}).refine((data) => {
  // If expense type is invoice, require invoiceId
  if (data.expenseType === "invoice" && !data.invoiceId) {
    return false;
  }
  return true;
}, {
  message: "Invoice must be selected for invoice expenses",
  path: ["expenseType"]
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  defaultValues?: Partial<ExpenseFormValues>;
  onSubmit: (data: ExpenseFormValues) => void;
  formId: string;
}

const ExpenseForm = ({ defaultValues, onSubmit, formId }: ExpenseFormProps) => {
  const { vendors, invoices: invoices_ } = useDataContext();
  const { getCurrencySymbol } = useOrganizationSettings();
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [vendorsList, setVendorsList] = useState<Vendor[]>(vendors as Vendor[]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activeInvoices, setActiveInvoices] = useState<any[]>([]);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: defaultValues || {
      date: new Date(),
      category: "",
      amount: 0,
      description: "",
      paymentMethod: "cash",
      expenseType: "workshop",
      vendorId: "none",
      invoiceId: "",
    },
  });

  const watchExpenseType = form.watch("expenseType");

  useEffect(() => {
    const loadData = async () => {
      setInvoices(invoices_);
      
      // Filter for active invoices only (open, in-progress)
      const activeInvoicesList = invoices_.filter(invoice => 
        invoice.status === 'open' || invoice.status === 'in-progress'
      );
      setActiveInvoices(activeInvoicesList);
    };

    loadData();
  }, [invoices_]);

  // When expense type changes, clear invoice selection if switching to workshop
  useEffect(() => {
    if (watchExpenseType === "workshop") {
      form.setValue("invoiceId", "");
    }
  }, [watchExpenseType, form]);

  // List of common expense categories
  const expenseCategories = [
    "Parts",
    "Supplies",
    "Tools",
    "Rent",
    "Utilities",
    "Salaries",
    "Insurance",
    "Advertising",
    "Maintenance",
    "Office Supplies",
    "Travel",
    "Other"
  ];

  // Handler for when a new vendor is added
  const handleVendorAdded = (vendor: Vendor) => {
    setVendorsList((prev) => [...prev, vendor]);
    // Optionally select the new vendor
    form.setValue("vendorId", vendor.id);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} id={formId} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expenseType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expense Type</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex flex-row space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="invoice" id="invoice-expense" />
                    <Label htmlFor="invoice-expense">Invoice Expense</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="workshop" id="workshop-expense" />
                    <Label htmlFor="workshop-expense">Workshop Expense</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchExpenseType === "invoice" && (
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
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
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
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount ({getCurrencySymbol()})</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="100.00"
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
                <Textarea placeholder="Expense description" {...field} rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormField
              control={form.control}
              name="vendorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <div className="flex space-x-2">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {vendorsList.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      onClick={() => setIsVendorDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {watchExpenseType === "workshop" && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Workshop Expense:</strong> This expense will be categorized as a general workshop expense for business operations.
            </p>
          </div>
        )}

        <VendorDialog
          open={isVendorDialogOpen}
          onOpenChange={setIsVendorDialogOpen}
          onVendorAdded={handleVendorAdded}
        />
      </form>
    </Form>
  );
};

export default ExpenseForm;
