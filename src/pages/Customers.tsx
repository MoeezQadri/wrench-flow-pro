import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Search, SortDesc, Users, Car, FileText, DollarSign, Download, X, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { objectsToCSV, downloadCSV } from '@/utils/csv-export';
import { Vehicle } from '@/types';
import { useDataContext } from '@/context/data/DataContext';
import { useAuthContext } from '@/context/AuthContext';
import { PageContainer } from '@/components/PageContainer';
import { usePageLoader } from '@/hooks/usePageLoader';
import { canManageCustomers, hasPermission } from '@/utils/permissions';

// Define the form validation schema using Zod
const customerSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters long"
  }),
  email: z.string().email({
    message: "Please enter a valid email address"
  }),
  phone: z.string().min(7, {
    message: "Phone number must be at least 7 characters long"
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters long"
  })
});
const vehicleSchema = z.object({
  make: z.string().min(1, {
    message: "Make is required"
  }),
  model: z.string().min(1, {
    message: "Model is required"
  }),
  year: z.string().min(4, {
    message: "Valid year is required"
  }),
  license_plate: z.string().min(1, {
    message: "License plate is required"
  }),
  vin: z.string().optional(),
  color: z.string().optional()
});

// Combined schema for customer with vehicle - conditional validation
const formSchema = z.object({
  customer: customerSchema,
  addVehicle: z.boolean().default(false),
  vehicle: z.union([
    vehicleSchema,
    z.undefined()
  ]).optional()
}).superRefine((data, ctx) => {
  // If addVehicle is checked, vehicle fields must be filled
  if (data.addVehicle && (!data.vehicle || !data.vehicle.make || !data.vehicle.model || !data.vehicle.year || !data.vehicle.license_plate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Vehicle information is required when 'Add vehicle information' is checked",
      path: ["vehicle"]
    });
  }
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const {
    customers,
    customersLoading,
    customersError,
    getCustomerAnalytics,
    getVehiclesByCustomerId,
    addCustomer,
    addVehicle,
    refreshAllData,
    loadCustomers
  } = useDataContext();
  const { currentUser } = useAuthContext();
  const { formatCurrency } = useOrganizationSettings();

  // Use unified page loader
  const { loading, error, retry } = usePageLoader({
    loadData: async () => {
      await loadCustomers();
    },
    dependencies: [],
    loadingMessage: "Loading customers..."
  });

  // Check permissions
  const userCanManageCustomers = canManageCustomers(currentUser);
  const userCanViewCustomers = hasPermission(currentUser, 'customers', 'view');
  // Initialize the form
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer: {
        name: "",
        email: "",
        phone: "",
        address: ""
      },
      addVehicle: false,
      vehicle: undefined
    }
  });

  // Watch the addVehicle checkbox to conditionally show vehicle fields
  const showVehicleFields = form.watch("addVehicle");

  // Clear vehicle fields when addVehicle is unchecked
  useEffect(() => {
    if (!showVehicleFields) {
      form.setValue("vehicle", undefined);
    } else {
      // Set default empty vehicle object when addVehicle is checked
      form.setValue("vehicle", {
        make: "",
        model: "",
        year: "",
        license_plate: "",
        vin: "",
        color: ""
      });
    }
  }, [showVehicleFields]);

  // Form submission handler - using useCallback to prevent re-renders
  const onSubmit = useCallback(async (values: CustomerFormValues) => {
    if (isSubmitting) return; // Prevent duplicate submissions
    
    // Immediately close dialog and reset form to prevent re-render interference
    setIsDialogOpen(false);
    form.reset({
      customer: { name: "", email: "", phone: "", address: "" },
      addVehicle: false,
      vehicle: undefined
    });
    
    setIsSubmitting(true);
    try {
      // Add the new customer to the data service
      const id = crypto.randomUUID();
      const newCustomer = await addCustomer({
        ...values.customer,
        organization_id: "00000000-0000-0000-0000-000000000001",
        id
      });

      // Add vehicle if the checkbox is checked and vehicle data is provided
      const vehicleId = crypto.randomUUID();
      if (values.addVehicle && values.vehicle) {
        const vehicleData: Vehicle = {
          ...values.vehicle,
          customer_id: newCustomer.id,
          id: vehicleId
        };
        await addVehicle(vehicleData);

        // Display success message including vehicle
        toast({
          title: "Customer and Vehicle Added",
          description: `${newCustomer.name} and their ${values.vehicle.make} ${values.vehicle.model} have been added successfully.`
        });
      } else {
        // Display success message for customer only
        toast({
          title: "Customer Added",
          description: `${newCustomer.name} has been added successfully.`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add customer. Please try again.",
        variant: "destructive"
      });
      // Reopen dialog on error so user can retry
      setIsDialogOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [addCustomer, addVehicle, form, isSubmitting]);

  // Filter customers based on search query - use customers from context directly
  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchQuery.toLowerCase();
    return customer.name.toLowerCase().includes(searchLower) || customer.email.toLowerCase().includes(searchLower) || customer.phone.includes(searchQuery) || customer.address.toLowerCase().includes(searchLower);
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
        LifetimeValue: formatCurrency(analytics.lifetimeValue),
        Vehicles: vehicles.length
      };
    }));

    // Convert to CSV and download
    const csv = objectsToCSV(exportData);
    downloadCSV(csv, 'customers.csv');
    toast({
      title: "Export Successful",
      description: `${exportData.length} customers exported to CSV`
    });
  };
  const handleRefreshData = async () => {
    toast({
      title: "Refreshing data...",
      description: "Loading latest customer information"
    });
    try {
      await refreshAllData();
      toast({
        title: "Data refreshed",
        description: "Customer data has been updated"
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not refresh customer data",
        variant: "destructive"
      });
    }
  };
  return (
    <PageContainer
      title="Customers"
      subtitle="Manage workshop customers"
      loading={customersLoading}
      error={customersError}
      onRetry={handleRefreshData}
      loadingMessage="Loading customers..."
      headerActions={
        <>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          {userCanManageCustomers && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Customer
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search customers..." 
            className="pl-8" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>
        <Button variant="outline">
          <SortDesc className="mr-2 h-4 w-4" />
          Sort
        </Button>
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/60" />
          <h3 className="mt-4 text-lg font-medium">No customers found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery ? "Try adjusting your search to find what you're looking for." : "Get started by adding your first customer."}
          </p>
          {!searchQuery && userCanManageCustomers && (
            <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          )}
        </Card>
      )}

      {/* Customer Grid */}
      {filteredCustomers.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map(customer => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      )}
      {/* New Customer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Enter the customer details below to add them to your workshop.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Customer Information Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Customer Information</h3>
                  <p className="text-sm text-muted-foreground">Required fields to create the customer</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="customer.name" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="customer.email" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input placeholder="customer@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="customer.phone" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Phone *</FormLabel>
                          <FormControl>
                            <Input placeholder="555-123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="customer.address" render={({
                    field
                  }) => <FormItem className="sm:col-span-1">
                          <FormLabel>Address *</FormLabel>
                          <FormControl>
                            <Textarea placeholder="123 Main St, Anytown" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                </div>
              </div>

              <Separator />

              {/* Vehicle Information Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Vehicle Information</h3>
                  <p className="text-sm text-muted-foreground">Optional - You can add vehicle details now or later</p>
                </div>

                <FormField control={form.control} name="addVehicle" render={({
                  field
                }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4 bg-muted/30">
                        <FormControl>
                          <input 
                            type="checkbox" 
                            checked={field.value} 
                            onChange={field.onChange} 
                            className="h-5 w-5 mt-0.5 rounded border-2 border-primary text-primary focus:ring-primary flex-shrink-0" 
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none min-w-0 flex-1">
                          <FormLabel className="text-base font-medium cursor-pointer">
                            Add vehicle information (Optional)
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            You can skip this and add vehicle details later from the customer's profile
                          </p>
                        </div>
                      </FormItem>} />

                {showVehicleFields && (
                  <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <FormField control={form.control} name="vehicle.make" render={({
                         field
                       }) => <FormItem>
                                 <FormLabel>{showVehicleFields ? "Make *" : "Make"}</FormLabel>
                                 <FormControl>
                                   <Input placeholder="Toyota" {...field} />
                                 </FormControl>
                                 <FormMessage />
                               </FormItem>} />

                       <FormField control={form.control} name="vehicle.model" render={({
                         field
                       }) => <FormItem>
                                 <FormLabel>{showVehicleFields ? "Model *" : "Model"}</FormLabel>
                                 <FormControl>
                                   <Input placeholder="Camry" {...field} />
                                 </FormControl>
                                 <FormMessage />
                               </FormItem>} />
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <FormField control={form.control} name="vehicle.year" render={({
                         field
                       }) => <FormItem>
                                 <FormLabel>{showVehicleFields ? "Year *" : "Year"}</FormLabel>
                                 <FormControl>
                                   <Input placeholder="2023" {...field} />
                                 </FormControl>
                                 <FormMessage />
                               </FormItem>} />

                       <FormField control={form.control} name="vehicle.license_plate" render={({
                         field
                       }) => <FormItem>
                                 <FormLabel>{showVehicleFields ? "License Plate *" : "License Plate"}</FormLabel>
                                <FormControl>
                                  <Input placeholder="ABC-123" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="vehicle.vin" render={({
                        field
                      }) => <FormItem>
                                <FormLabel>VIN (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="1HGBH41JXMN109186" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>} />

                      <FormField control={form.control} name="vehicle.color" render={({
                        field
                      }) => <FormItem>
                                <FormLabel>Color (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="Silver" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>} />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? 'Adding Customer...' : 'Add Customer'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

// Extracted component for customer card
const CustomerCard = ({
  customer
}: {
  customer: any;
}) => {
  const [analytics, setAnalytics] = useState<any>({
    totalInvoices: 0,
    lifetimeValue: 0
  });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const {
    formatCurrency
  } = useOrganizationSettings();
  const {
    getCustomerAnalytics,
    getVehiclesByCustomerId
  } = useDataContext();

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const [analyticsData, vehiclesData] = await Promise.all([
          getCustomerAnalytics(customer.id),
          getVehiclesByCustomerId(customer.id)
        ]);
        
        if (isMounted) {
          setAnalytics(analyticsData);
          setVehicles(vehiclesData);
        }
      } catch (error) {
        console.error('Error loading customer card data:', error);
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [customer.id, getCustomerAnalytics, getVehiclesByCustomerId]);
  return <Link to={`/customers/${customer.id}`}>
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
              <p className="text-sm font-medium">{formatCurrency(analytics.lifetimeValue)}</p>
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
    </Link>;
};
export default Customers;