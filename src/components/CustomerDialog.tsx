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
import { Customer } from "@/types";
import CustomerForm, { CustomerFormValues } from "./customer/CustomerForm";
import { generateId, getCurrentUser, hasPermission } from "@/services/data-service";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (customer: Customer) => void;
  customer?: Customer;
}

const CustomerDialog = ({ open, onOpenChange, onSave, customer }: CustomerDialogProps) => {
  const isEditing = !!customer;
  const formId = "customer-form";
  const currentUser = getCurrentUser();
  
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
        totalVisits: customer?.totalVisits || 0,
        lifetimeValue: customer?.lifetimeValue || 0,
        lastVisit: customer?.lastVisit || null,
        created_at: customer?.created_at || new Date().toISOString(),
        total_visits: customer?.total_visits || 0,
        lifetime_value: customer?.lifetime_value || 0,
        last_visit: customer?.last_visit || null,
      };
      
      onSave(newCustomer);
      toast.success(`Customer ${isEditing ? "updated" : "added"} successfully!`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Failed to save customer. Please try again.");
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId}>
            {isEditing ? "Update" : "Add"} Customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDialog;
