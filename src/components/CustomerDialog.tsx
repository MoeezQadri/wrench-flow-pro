
import React, { useState } from "react";
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
import { Customer } from "@/types";
import CustomerForm, { CustomerFormValues } from "./customer/CustomerForm";
import { hasPermission } from "@/services/data-service";
import { useAuthContext } from "@/context/AuthContext";

const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (customer: Customer) => Promise<void>;
  customer?: Customer;
}

const CustomerDialog = ({ open, onOpenChange, onSave, customer }: CustomerDialogProps) => {
  const isEditing = !!customer;
  const formId = "customer-form";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    currentUser
  } = useAuthContext()

  // Check if user has permission to manage customers
  const canManageCustomers = hasPermission(currentUser, 'customers', 'manage');

  if (!canManageCustomers) {
    return null;
  }

  const handleSubmit = async (data: CustomerFormValues) => {
    if (isSubmitting) return; // Prevent duplicate submissions
    
    setIsSubmitting(true);
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
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Failed to save customer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting 
              ? (isEditing ? "Updating..." : "Adding...") 
              : (isEditing ? "Update" : "Add") + " Customer"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDialog;
