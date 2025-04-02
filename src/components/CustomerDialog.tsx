
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Car } from "lucide-react";
import { Customer, Vehicle } from "@/types";
import { addCustomer, addVehicle } from "@/services/data-service";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

// Customer form schema with required fields
const customerSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(1, { message: "Phone number is required" }),
  address: z.string().min(1, { message: "Address is required" }),
});

// Vehicle form schema
const vehicleSchema = z.object({
  make: z.string().min(1, { message: "Make is required" }),
  model: z.string().min(1, { message: "Model is required" }),
  year: z.string().min(4, { message: "Valid year is required" }),
  licensePlate: z.string().min(1, { message: "License plate is required" }),
  vin: z.string().optional(),
  color: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;
type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerAdded: (customer: Customer) => void;
}

const CustomerDialog = ({ open, onOpenChange, onCustomerAdded }: CustomerDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleFormValues[]>([]);
  const [activeTab, setActiveTab] = useState("customer");

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const vehicleForm = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: "",
      model: "",
      year: "",
      licensePlate: "",
      vin: "",
      color: "",
    },
  });

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      form.reset();
      vehicleForm.reset();
      setVehicles([]);
      setActiveTab("customer");
    }
  }, [open, form, vehicleForm]);

  const addVehicleToList = vehicleForm.handleSubmit((data) => {
    setVehicles((prev) => [...prev, { ...data }]);
    vehicleForm.reset();
    toast.success("Vehicle added to list");
  });

  const removeVehicle = (index: number) => {
    setVehicles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CustomerFormValues) => {
    setIsSubmitting(true);
    try {
      // Add customer first - ensure data is passed with required fields
      const customerData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address
      };
      
      const newCustomer = addCustomer(customerData);
      
      // Then add all vehicles for this customer if any exist
      if (vehicles.length > 0) {
        vehicles.forEach(vehicle => {
          // Ensure vehicle data has all required fields
          const vehicleData = {
            customerId: newCustomer.id,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            licensePlate: vehicle.licensePlate,
            vin: vehicle.vin,
            color: vehicle.color
          };
          
          addVehicle(vehicleData);
        });
      }
      
      onCustomerAdded(newCustomer);
      form.reset();
      vehicleForm.reset();
      setVehicles([]);
      onOpenChange(false);
      toast.success("Customer added successfully");
    } catch (error) {
      toast.error("Failed to add customer");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Fill in the customer details below. You can also add vehicles for this customer.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customer">Customer Info</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          </TabsList>
          
          <TabsContent value="customer">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} id="customerForm" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
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
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, Anytown" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="vehicles">
            <div className="space-y-4">
              <Form {...vehicleForm}>
                <form onSubmit={addVehicleToList} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={vehicleForm.control}
                      name="make"
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
                      control={vehicleForm.control}
                      name="model"
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
                      control={vehicleForm.control}
                      name="year"
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
                      control={vehicleForm.control}
                      name="licensePlate"
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
                      control={vehicleForm.control}
                      name="vin"
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
                      control={vehicleForm.control}
                      name="color"
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

                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                    <Car className="h-4 w-4 mr-2" />
                    Add Vehicle to List
                  </Button>
                </form>
              </Form>

              {vehicles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="font-medium">Vehicles to add:</h3>
                  <div className="border rounded-md p-2 max-h-48 overflow-y-auto">
                    {vehicles.map((vehicle, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded mb-2">
                        <div>
                          <span className="font-medium">
                            {vehicle.make} {vehicle.model} ({vehicle.year})
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {vehicle.licensePlate}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVehicle(index)}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {activeTab === "customer" && vehicles.length > 0 && (
                <span className="text-sm text-green-600">
                  {vehicles.length} vehicle(s) will be added
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              {activeTab === "customer" ? (
                <Button 
                  type="submit" 
                  form="customerForm" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Customer"}
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={() => setActiveTab("customer")}
                >
                  Back to Customer Info
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDialog;
