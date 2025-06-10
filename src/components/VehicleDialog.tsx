
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Vehicle } from "@/types";
import VehicleFormSection, { VehicleFormValues } from "./vehicle/VehicleFormSection";
import { hasPermission } from "@/services/data-service";
import { useAuthContext } from "@/context/AuthContext";

const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

interface VehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (vehicle: Vehicle) => void;
  vehicle?: Vehicle;
  customerId?: string;
}

const VehicleDialog = ({ open, onOpenChange, onSave, vehicle, customerId }: VehicleDialogProps) => {
  const isEditing = !!vehicle;
  const formId = "vehicle-form";
  const { currentUser } = useAuthContext();

  // Check if user has permission to manage vehicles
  const canManageVehicles = hasPermission(currentUser, 'vehicles', 'manage');

  if (!canManageVehicles) {
    return null;
  }

  const handleSubmit = async (data: VehicleFormValues) => {
    try {
      const newVehicle: Vehicle = {
        id: vehicle?.id || generateId("vehicle"),
        customer_id: data.customer_id,
        make: data.make,
        model: data.model,
        year: data.year,
        license_plate: data.license_plate,
        vin: data.vin || "",
        color: data.color || "",
        created_at: vehicle?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      onSave(newVehicle);
      toast.success(`Vehicle ${isEditing ? "updated" : "added"} successfully!`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast.error("Failed to save vehicle. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the vehicle information below."
              : "Enter the details for the new vehicle. A customer must be selected."}
          </DialogDescription>
        </DialogHeader>

        <VehicleFormSection
          defaultValues={
            vehicle
              ? {
                customer_id: vehicle.customer_id,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
                license_plate: vehicle.license_plate,
                vin: vehicle.vin || "",
                color: vehicle.color || "",
              }
              : undefined
          }
          onSubmit={handleSubmit}
          formId={formId}
          preselectedCustomerId={customerId}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId}>
            {isEditing ? "Update" : "Add"} Vehicle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleDialog;
