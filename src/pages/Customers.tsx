import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  PlusCircle,
  Search,
  SortDesc,
  Users,
  Car,
  FileText,
  DollarSign,
  Download,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { objectsToCSV, downloadCSV } from '@/utils/csv-export';
import { Vehicle } from '@/types';
import { useDataContext } from '@/context/data/DataContext';

// Define the form validation schema using Zod
const customerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(7, { message: "Phone number must be at least 7 characters long" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters long" }),
});

const vehicleSchema = z.object({
  make: z.string().min(1, { message: "Make is required" }),
  model: z.string().min(1, { message: "Model is required" }),
  year: z.string().min(4, { message: "Valid year is required" }),
  license_plate: z.string().min(1, { message: "License plate is required" }),
  vin: z.string().optional(),
  color: z.string().optional(),
});

// Combined schema for customer with vehicle
const formSchema = z.object({
  customer: customerSchema,
  addVehicle: z.boolean().default(false),
  vehicle: vehicleSchema.optional(),
});

// Define type for form values ensuring all fields are required
type CustomerFormValues = {
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  addVehicle: boolean;
  vehicle?: {
    make: string;
    model: string;
    year: string;
    license_plate: string;
    vin?: string;
    color?: string;
  };
};

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const {
    customers, getCustomerAnalytics, getVehiclesByCustomerId, addCustomer, addVehicle
  } = useDataContext();

  // Initialize the form
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer: {
        name: "",
        email: "",
        phone: "",
        address: "",
      },
      addVehicle: false,
      vehicle: {
        make: "",
        model: "",
        year: "",
        license_plate: "",
        vin: "",
        color: "",
      },
    },
  });

  // Watch the addVehicle checkbox to conditionally show vehicle fields
  const showVehicleFields = form.watch("addVehicle");

  // Form submission handler
  const onSubmit = async (values: CustomerFormValues) => {
    // Add the new customer to the data service
    const id = crypto.randomUUID();
    const newCustomer = await addCustomer({ ...values.customer, id });

    // Add vehicle if the checkbox is checked and vehicle data is provided
    const vehicleId = crypto.randomUUID();

    if (values.addVehicle && values.vehicle) {
      const vehicleData: Vehicle = {
        ...values.vehicle,
        customer_id: newCustomer.id,
        id: vehicleId
      };

      const newVehicle = await addVehicle(vehicleData);

      // Display success message including vehicle
      toast({
        title: "Customer and Vehicle Added",
        description: `${newCustomer.name} and their ${values.vehicle.make} ${values.vehicle.model} have been added successfully.`,
      });
    } else {
      // Display success message for customer only
      toast({
        title: "Customer Added",
        description: `${newCustomer.name} has been added successfully.`,
      });
    }

    // Reset form and close dialog
    form.reset();
    setIsDialogOpen(false);
  };

  // Filter customers based on search query - use customers from context directly
  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phone.includes(searchQuery) ||
      customer.address.toLowerCase().includes(searchLower)
    );
  });

  // Handle CSV export
  const handleExportCSV = async () => {
    // Create a simplified version of customer data for export
    const exportData = await Promise.all(customers.map(async customer => {
      const analytics = await getCustomerAnalytics(customer.id);
      const vehicles = await getVehiclesByCustomerId(customer.id);
      return {
        Name: customer.name,
        Email: customer.email,
        Phone: customer.phone,
        Address: customer.address,
        LastVisit: customer.lastVisit || 'N/A',
        TotalVisits: analytics.totalInvoices,
        LifetimeValue: `$${analytics.lifetimeValue.toFixed(2)}`,
        Vehicles: vehicles.length
      };
    }));

    // Convert to CSV and download
    const csv = objectsToCSV(exportData);
    downloadCSV(csv, 'customers.csv');

    toast({
      title: "Export Successful",
      description: `${exportData.length} customers exported to CSV`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage workshop customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Customer
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Button variant="outline">
          <SortDesc className="mr-2 h-4 w-4" />
          Sort
        </Button>
      </div>

      {filteredCustomers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/60" />
          <h3 className="mt-4 text-lg font-medium">No customers found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your search to find what you're looking for.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      )}

      {/* New Customer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Enter the customer details below to add them to your workshop.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Tabs defaultValue="customer" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="customer">Customer Info</TabsTrigger>
                  <TabsTrigger value="vehicle">Vehicle Info</TabsTrigger>
                </TabsList>

                <TabsContent value="customer" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="customer.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="customer@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="555-123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="123 Main St, Anytown" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="vehicle" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="addVehicle"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Add a vehicle for this customer</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Check this box to add vehicle information
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {showVehicleFields && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="vehicle.make"
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
                          name="vehicle.model"
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

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="vehicle.year"
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
                          name="vehicle.license_plate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>License Plate</FormLabel>
                              <FormControl>
                                <Input placeholder="ABC-123" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="vehicle.vin"
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
                          name="vehicle.color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Silver" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Add Customer</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Extracted component for customer card
const CustomerCard = ({ customer }: { customer: any }) => {
  const [analytics, setAnalytics] = useState<any>({
    totalInvoices: 0,
    lifetimeValue: 0
  });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const {
    getCustomerAnalytics,
    getVehiclesByCustomerId
  } = useDataContext();
  useEffect(() => {
    const loadData = async () => {
      const analyticsData = await getCustomerAnalytics(customer.id);
      const vehiclesData = await getVehiclesByCustomerId(customer.id);

      setAnalytics(analyticsData);
      setVehicles(vehiclesData);
    };

    loadData();
  }, [customer.id]);

  return (
    <Link to={`/customers/${customer.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-lg">{customer.name}</h3>
              <p className="text-sm text-muted-foreground">{customer.email}</p>
            </div>
            <Badge variant="outline">
              {analytics.totalInvoices} {analytics.totalInvoices === 1 ? 'visit' : 'visits'}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center">
              <Car className="h-4 w-4 mb-1 text-muted-foreground" />
              <p className="text-sm font-medium">{vehicles.length}</p>
              <p className="text-xs text-muted-foreground">Vehicles</p>
            </div>
            <div className="flex flex-col items-center">
              <FileText className="h-4 w-4 mb-1 text-muted-foreground" />
              <p className="text-sm font-medium">{analytics.totalInvoices}</p>
              <p className="text-xs text-muted-foreground">Invoices</p>
            </div>
            <div className="flex flex-col items-center">
              <DollarSign className="h-4 w-4 mb-1 text-muted-foreground" />
              <p className="text-sm font-medium">${analytics.lifetimeValue.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Value</p>
            </div>
          </div>

          <div className="mt-4 flex items-center">
            <p className="text-xs text-muted-foreground">
              Last Visit: {customer.lastVisit || 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default Customers;
