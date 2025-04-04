
import React, { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Customer } from "@/types";
import { addCustomer, addVehicle } from "@/services/data-service";
import CustomerForm, { CustomerFormValues } from "@/components/customer/CustomerForm";
import VehicleFormSection, { VehicleFormValues } from "@/components/vehicle/VehicleFormSection";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerAdded: (customer: Customer) => void;
}

const CustomerDialog = ({ open, onOpenChange, onCustomerAdded }: CustomerDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleFormValues[]>([]);
  const [activeTab, setActiveTab] = useState("customer");

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setVehicles([]);
      setActiveTab("customer");
    }
  }, [open]);

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
      
      // Call addCustomer with the customer data directly
      const newCustomer = await addCustomer(customerData);
      
      // Then add all vehicles for this customer if any exist
      if (vehicles.length > 0) {
        for (const vehicle of vehicles) {
          // Ensure vehicle data has all required fields
          const vehicleData = {
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            licensePlate: vehicle.licensePlate,
            vin: vehicle.vin,
            color: vehicle.color
          };
          
          // Pass customerId and vehicle data to addVehicle
          await addVehicle(newCustomer.id, vehicleData);
        }
      }
      
      onCustomerAdded(newCustomer);
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
            <CustomerForm formId="customerForm" onSubmit={onSubmit} />
          </TabsContent>
          
          <TabsContent value="vehicles">
            <VehicleFormSection vehicles={vehicles} setVehicles={setVehicles} />
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
