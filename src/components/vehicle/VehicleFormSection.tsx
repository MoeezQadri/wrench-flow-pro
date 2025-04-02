
import React, { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Car, X } from "lucide-react";
import { toast } from "sonner";

// Vehicle form schema
const vehicleSchema = z.object({
  make: z.string().min(1, { message: "Make is required" }),
  model: z.string().min(1, { message: "Model is required" }),
  year: z.string().min(4, { message: "Valid year is required" }),
  licensePlate: z.string().min(1, { message: "License plate is required" }),
  vin: z.string().optional(),
  color: z.string().optional(),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface VehicleFormSectionProps {
  vehicles: VehicleFormValues[];
  setVehicles: React.Dispatch<React.SetStateAction<VehicleFormValues[]>>;
}

const VehicleFormSection = ({ vehicles, setVehicles }: VehicleFormSectionProps) => {
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

  const addVehicleToList = vehicleForm.handleSubmit((data) => {
    setVehicles((prev) => [...prev, { ...data }]);
    vehicleForm.reset();
    toast.success("Vehicle added to list");
  });

  const removeVehicle = (index: number) => {
    setVehicles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
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
  );
};

export default VehicleFormSection;
