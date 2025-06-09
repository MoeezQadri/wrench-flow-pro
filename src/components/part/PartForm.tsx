
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
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Invoice, Part } from "@/types";
import { X } from "lucide-react";
import { useDataContext } from "@/context/data/DataContext";

const partSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  price: z.coerce.number().min(0.01, { message: "Price must be at least 0.01" }),
  quantity: z.coerce.number().min(0, { message: "Quantity cannot be negative" }),
  description: z.string().min(1, { message: "Description is required" }),
  vendorId: z.string().optional(),
  vendorName: z.string().optional(),
  partNumber: z.string().optional(),
  invoiceIds: z.array(z.string()).optional(),
});

export type PartFormValues = z.infer<typeof partSchema>;

interface PartFormProps {
  defaultValues?: PartFormValues;
  onSubmit: (data: PartFormValues) => void;
  formId: string;
  invoice?: Invoice | null;
  invoiceId?: string;
  part?: Part;
}

const PartForm = ({ defaultValues, onSubmit, formId, invoice, invoiceId, part }: PartFormProps) => {
  const [availableInvoices, setAvailableInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInvoiceSelection, setShowInvoiceSelection] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

  const {
    vendors, invoices: invoices_
  } = useDataContext();

  const form = useForm<PartFormValues>({
    resolver: zodResolver(partSchema),
    defaultValues: defaultValues || {
      name: "",
      price: 0,
      quantity: 0,
      description: "",
      vendorId: "none",
      vendorName: "",
      partNumber: "",
      invoiceIds: [],
    },
  });

  // Load available invoices for selection
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        const invoices = invoices_;
        // Only show active invoices for selection
        const activeInvoices = invoices.filter(inv =>
          ["open", "in-progress", "completed", "partial"].includes(inv.status)
        );
        setAvailableInvoices(activeInvoices);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  // Initialize form with any existing invoice associations
  useEffect(() => {
    if (part?.invoice_ids && part.invoice_ids.length > 0) {
      setShowInvoiceSelection(true);
      setSelectedInvoiceIds(part.invoice_ids);
      form.setValue('invoiceIds', part.invoice_ids);
    }
    // If form is being opened with a specific invoice already selected
    if (invoiceId) {
      setShowInvoiceSelection(true);
      setSelectedInvoiceIds(prev => {
        const newIds = [...prev];
        if (!newIds.includes(invoiceId)) {
          newIds.push(invoiceId);
        }
        return newIds;
      });
      form.setValue('invoiceIds', selectedInvoiceIds);
    }
  }, [part, invoiceId, form]);

  // Handle selecting an invoice
  const handleInvoiceSelect = (invoiceId: string) => {
    setSelectedInvoiceIds(prev => {
      const newIds = [...prev];
      if (!newIds.includes(invoiceId)) {
        newIds.push(invoiceId);
      }
      return newIds;
    });
    form.setValue('invoiceIds', selectedInvoiceIds);
  };

  // Handle removing an invoice
  const handleInvoiceRemove = (invoiceId: string) => {
    setSelectedInvoiceIds(prev => {
      const newIds = prev.filter(id => id !== invoiceId);
      return newIds;
    });
    form.setValue('invoiceIds', selectedInvoiceIds);
  };

  // Before submitting, ensure invoiceIds is properly set
  const handleFormSubmit = (data: PartFormValues) => {
    const formData = { ...data };

    if (showInvoiceSelection) {
      formData.invoiceIds = selectedInvoiceIds;
    } else {
      formData.invoiceIds = [];
    }

    onSubmit(formData);
  };

  // Get invoice details by id
  const getInvoiceDetails = (invoiceId: string) => {
    const invoice = availableInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) return 'Unknown Invoice';

    const vehicleInfo = invoice.vehicleInfo;
    return `${vehicleInfo.make} ${vehicleInfo.model} (${vehicleInfo.license_plate})`;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} id={formId} className="space-y-4">
        {invoice && (
          <div className="rounded-md bg-muted p-3 mb-4">
            <p className="text-sm font-medium">Adding part to invoice:</p>
            <p className="text-sm">
              Vehicle: {invoice.vehicleInfo.make} {invoice.vehicleInfo.model} ({invoice.vehicleInfo.year})
            </p>
            <p className="text-sm">License Plate: {invoice.vehicleInfo.license_plate}</p>
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

        <FormField
          control={form.control}
          name="vendorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vendor Name (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Vendor name" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        {/* Invoice Association Section */}
        <div className="border rounded-md p-4 mt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="invoice-tagging"
              checked={showInvoiceSelection}
              onCheckedChange={(checked) => setShowInvoiceSelection(!!checked)}
            />
            <label
              htmlFor="invoice-tagging"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              Tag this part to invoices (optional)
            </label>
          </div>

          {showInvoiceSelection && (
            <>
              <div className="mb-4">
                <FormLabel>Select Invoices</FormLabel>
                <Select
                  onValueChange={handleInvoiceSelect}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an invoice to tag" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableInvoices.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {getInvoiceDetails(invoice.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Tag this part to one or more invoices
                </FormDescription>
              </div>

              <div>
                <FormLabel>Selected Invoices</FormLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedInvoiceIds.length > 0 ? (
                    selectedInvoiceIds.map(id => (
                      <Badge
                        key={id}
                        variant="outline"
                        className="flex items-center gap-1 pr-1"
                      >
                        <span className="truncate max-w-[150px]">
                          {getInvoiceDetails(id)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleInvoiceRemove(id)}
                          className="hover:bg-muted rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No invoices selected</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </form>
    </Form>
  );
};

export default PartForm;
