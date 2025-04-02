
import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserPlus, Car } from "lucide-react";
import { Customer, Vehicle } from "@/types";
import { getVehiclesByCustomerId } from "@/services/data-service";

interface CustomerVehicleSelectionProps {
  customers: Customer[];
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  setCustomerDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setVehicleDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CustomerVehicleSelection = ({
  customers,
  vehicles,
  setVehicles,
  setCustomerDialogOpen,
  setVehicleDialogOpen,
}: CustomerVehicleSelectionProps) => {
  const form = useFormContext();
  const watchCustomerId = form.watch("customerId");

  // Update vehicles when customer changes
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
  }, [watchCustomerId, form, setVehicles]);

  // Get customer name for display
  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : "";
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Customer Selection */}
      <FormField
        control={form.control}
        name="customerId"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Customer</FormLabel>
            <div className="flex items-center gap-2">
              <FormControl className="flex-1">
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <Button
                type="button"
                onClick={() => setCustomerDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 px-4"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Vehicle Selection */}
      <FormField
        control={form.control}
        name="vehicleId"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Vehicle</FormLabel>
            <div className="flex items-center gap-2">
              <FormControl className="flex-1">
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!watchCustomerId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        watchCustomerId
                          ? vehicles.length > 0 
                            ? "Select a vehicle"
                            : `No vehicles for ${getCustomerName(watchCustomerId)}`
                          : "Select a customer first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.year}) -{" "}
                        {vehicle.licensePlate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <Button
                type="button"
                onClick={() => setVehicleDialogOpen(true)}
                disabled={!watchCustomerId}
                className="bg-orange-500 hover:bg-orange-600 px-4"
              >
                <Car className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default CustomerVehicleSelection;
