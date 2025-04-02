import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, Plus, X, UserPlus, Car } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
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
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import CustomerDialog from "@/components/CustomerDialog";
import VehicleDialog from "@/components/VehicleDialog";

import { InvoiceItem, InvoiceStatus, Customer, Vehicle } from "@/types";
import { getCustomers, getVehiclesByCustomerId } from "@/services/data-service";

// Invoice form schema
const invoiceFormSchema = z.object({
  customerId: z.string({ required_error: "Please select a customer" }),
  vehicleId: z.string({ required_error: "Please select a vehicle" }),
  date: z.date({ required_error: "Please select a date" }),
  dueDate: z.date({ required_error: "Please select a due date" }),
  status: z.enum(["open", "in-progress", "completed", "paid"] as const),
  notes: z.string().optional(),
  taxRate: z.coerce.number().min(0).max(100).default(0),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

const InvoiceForm = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [newItemType, setNewItemType] = useState<"labor" | "part">("labor");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);

  // Initialize form
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      date: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: "open",
      taxRate: 7.5, // Default tax rate
    },
  });

  // Fetch customers
  useEffect(() => {
    const customersList = getCustomers();
    setCustomers(customersList);
  }, []);

  // Update vehicles when customer changes
  const watchCustomerId = form.watch("customerId");
  useEffect(() => {
    if (watchCustomerId) {
      const customerVehicles = getVehiclesByCustomerId(watchCustomerId);
      setVehicles(customerVehicles);
      
      // Reset vehicle selection if current selection doesn't belong to this customer
      const currentVehicle = form.getValues("vehicleId");
      if (currentVehicle && !customerVehicles.some(v => v.id === currentVehicle)) {
        form.setValue("vehicleId", "");
      }
    } else {
      setVehicles([]);
    }
  }, [watchCustomerId, form]);

  // Handle new customer added
  const handleCustomerAdded = (newCustomer: Customer) => {
    setCustomers(prev => [...prev, newCustomer]);
    form.setValue("customerId", newCustomer.id);
    
    // Clear vehicle selection since the new customer has no vehicles
    form.setValue("vehicleId", "");
    setVehicles([]);
  };

  // Handle new vehicle added
  const handleVehicleAdded = (newVehicle: Vehicle) => {
    setVehicles(prev => [...prev, newVehicle]);
    form.setValue("vehicleId", newVehicle.id);
  };

  // Add new item to invoice
  const handleAddItem = () => {
    if (!newItemDescription || newItemQuantity <= 0 || newItemPrice <= 0) {
      toast.error("Please fill all item details correctly");
      return;
    }

    const newItem: InvoiceItem = {
      id: Date.now().toString(), // Temporary ID
      type: newItemType,
      description: newItemDescription,
      quantity: newItemQuantity,
      price: newItemPrice,
    };

    setItems([...items, newItem]);
    
    // Reset item form
    setNewItemDescription("");
    setNewItemQuantity(1);
    setNewItemPrice(0);
  };

  // Remove item from invoice
  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  
  // Calculate tax
  const taxRate = form.getValues("taxRate") || 0;
  const tax = subtotal * (taxRate / 100);
  
  // Calculate total
  const total = subtotal + tax;

  // Handle form submission
  const onSubmit = (data: InvoiceFormValues) => {
    if (items.length === 0) {
      toast.error("Please add at least one item to the invoice");
      return;
    }

    // Prepare invoice data
    const invoiceData = {
      ...data,
      items,
      date: format(data.date, "yyyy-MM-dd"),
      dueDate: format(data.dueDate, "yyyy-MM-dd"),
    };

    // Here you would normally save the invoice to your backend
    console.log("Invoice data:", invoiceData);
    
    toast.success("Invoice created successfully!");
    navigate("/invoices");
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Customer Selection */}
            <div className="flex space-x-2 items-end">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
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
              </div>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => setCustomerDialogOpen(true)}
                className="mb-2"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>

            {/* Vehicle Selection */}
            <div className="flex space-x-2 items-end">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!watchCustomerId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={watchCustomerId ? "Select a vehicle" : "Select a customer first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.make} {vehicle.model} ({vehicle.year}) - {vehicle.licensePlate}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => setVehicleDialogOpen(true)}
                disabled={!watchCustomerId}
                className="mb-2"
              >
                <Car className="h-4 w-4" />
              </Button>
            </div>

            {/* Invoice Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Invoice Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className="pl-3 text-left font-normal"
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
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Due Date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className="pl-3 text-left font-normal"
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
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tax Rate */}
            <FormField
              control={form.control}
              name="taxRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Rate (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      max="100"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Invoice Items Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Invoice Items</h3>
            
            {/* Add New Item Form */}
            <Card className="p-4">
              <div className="grid gap-4 md:grid-cols-5">
                <div>
                  <FormLabel htmlFor="itemType">Type</FormLabel>
                  <Select
                    value={newItemType}
                    onValueChange={(value: "labor" | "part") => setNewItemType(value)}
                  >
                    <SelectTrigger id="itemType">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="labor">Labor</SelectItem>
                      <SelectItem value="part">Part</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <FormLabel htmlFor="itemDescription">Description</FormLabel>
                  <Input
                    id="itemDescription"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    placeholder="Description"
                  />
                </div>
                
                <div>
                  <FormLabel htmlFor="itemQuantity">Quantity</FormLabel>
                  <Input
                    id="itemQuantity"
                    type="number"
                    min="1"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <FormLabel htmlFor="itemPrice">Price ($)</FormLabel>
                  <Input
                    id="itemPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  type="button" 
                  onClick={handleAddItem}
                  className="flex items-center"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </Card>
            
            {/* Items Table */}
            {items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.type === "labor" ? "Labor" : "Part"}
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                      <TableCell>${(item.quantity * item.price).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-medium">
                      Subtotal
                    </TableCell>
                    <TableCell className="font-medium">${subtotal.toFixed(2)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-medium">
                      Tax ({taxRate}%)
                    </TableCell>
                    <TableCell className="font-medium">${tax.toFixed(2)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right text-lg font-bold">
                      Total
                    </TableCell>
                    <TableCell className="text-lg font-bold">${total.toFixed(2)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <div className="rounded-md border border-dashed p-8 text-center">
                <p className="text-muted-foreground">No items added yet. Add some items to the invoice.</p>
              </div>
            )}
          </div>
          
          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional notes about this invoice"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate("/invoices")}
            >
              Cancel
            </Button>
            <Button type="submit">Create Invoice</Button>
          </div>
        </form>
      </Form>

      {/* Customer Dialog */}
      <CustomerDialog 
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        onCustomerAdded={handleCustomerAdded}
      />

      {/* Vehicle Dialog */}
      <VehicleDialog
        open={vehicleDialogOpen}
        onOpenChange={setVehicleDialogOpen}
        customerId={watchCustomerId}
        onVehicleAdded={handleVehicleAdded}
      />
    </div>
  );
};

export default InvoiceForm;
