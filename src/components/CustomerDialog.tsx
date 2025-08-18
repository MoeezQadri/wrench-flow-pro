
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Customer } from "@/types";
import CustomerForm, { CustomerFormValues } from "./customer/CustomerForm";
import { hasPermission } from "@/services/data-service";
import { useAuthContext } from "@/context/AuthContext";
import VehicleDialog from "./VehicleDialog";

const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (customer: Customer) => Promise<void>;
  onVehicleSave?: (vehicle: any) => void;
  customer?: Customer;
}

const CustomerDialog = ({ open, onOpenChange, onSave, onVehicleSave, customer }: CustomerDialogProps) => {
  const isEditing = !!customer;
  const formId = "customer-form";
  const [showVehiclePrompt, setShowVehiclePrompt] = useState(false);
  const [showVehicleDialog, setShowVehicleDialog] = useState(false);
  const [savedCustomerId, setSavedCustomerId] = useState<string>("");
  const {
    currentUser
  } = useAuthContext()

  // Check if user has permission to manage customers
  const canManageCustomers = hasPermission(currentUser, 'customers', 'manage');

  if (!canManageCustomers) {
    return null;
  }

  const handleSubmit = async (data: CustomerFormValues) => {
    try {
      const newCustomer: Customer = {
        id: customer?.id || generateId("customer"),
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        organization_id: customer?.organization_id || "00000000-0000-0000-0000-000000000001",
        created_at: customer?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await onSave(newCustomer);
      toast.success(`Customer ${isEditing ? "updated" : "added"} successfully!`);
      onOpenChange(false);
      
      // If creating a new customer, prompt to add vehicle
      if (!isEditing) {
        setSavedCustomerId(newCustomer.id);
        setShowVehiclePrompt(true);
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Failed to save customer. Please try again.");
    }
  };

  const handleAddVehicle = () => {
    setShowVehiclePrompt(false);
    setShowVehicleDialog(true);
  };

  const handleSkipVehicle = () => {
    setShowVehiclePrompt(false);
    setSavedCustomerId("");
  };

  const handleVehicleSave = (vehicle: any) => {
    if (onVehicleSave) {
      onVehicleSave(vehicle);
    }
    setShowVehicleDialog(false);
    setSavedCustomerId("");
    toast.success("Vehicle added successfully!");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the customer's information below."
                : "Enter the details for the new customer."}
            </DialogDescription>
          </DialogHeader>

          <CustomerForm
            defaultValues={
              customer
                ? {
                  name: customer.name,
                  email: customer.email || "",
                  phone: customer.phone || "",
                  address: customer.address || "",
                }
                : undefined
            }
            onSubmit={handleSubmit}
            formId={formId}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form={formId}>
              {isEditing ? "Update" : "Add"} Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showVehiclePrompt} onOpenChange={setShowVehiclePrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to add a vehicle for this customer now? This will help you create invoices and track services more easily.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSkipVehicle}>Skip for now</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddVehicle}>Add Vehicle</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <VehicleDialog
        open={showVehicleDialog}
        onOpenChange={setShowVehicleDialog}
        onSave={handleVehicleSave}
        customerId={savedCustomerId}
      />
    </>
  );
};

export default CustomerDialog;
