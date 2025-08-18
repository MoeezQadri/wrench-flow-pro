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
import { Vendor } from "@/types";
import VendorForm, { VendorFormValues } from "./VendorForm";
import { useDataContext } from "@/context/data/DataContext";

interface VendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorSaved?: (vendor: Vendor) => void;
  vendor?: Vendor;
}

const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const VendorDialog = ({ open, onOpenChange, onVendorSaved, vendor }: VendorDialogProps) => {
  const isEditing = !!vendor;
  const formId = "vendor-form";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addVendor, updateVendor } = useDataContext();

  const handleSubmit = async (data: VendorFormValues) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      let savedVendor: Vendor;

      if (isEditing) {
        const updatedVendor: Vendor = {
          ...vendor,
          name: data.name,
          contact_name: data.contact_name,
          phone: data.phone,
          email: data.email || "",
          address: data.address || "",
          notes: data.notes || "",
          updated_at: new Date().toISOString(),
        };
        await updateVendor(vendor.id, updatedVendor);
        savedVendor = updatedVendor;
      } else {
        const newVendor: Omit<Vendor, "id"> = {
          name: data.name,
          contact_name: data.contact_name,
          phone: data.phone,
          email: data.email || "",
          address: data.address || "",
          notes: data.notes || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        savedVendor = await addVendor(newVendor);
      }

      toast.success(`Vendor ${isEditing ? "updated" : "added"} successfully!`);
      onOpenChange(false);
      
      if (onVendorSaved) {
        onVendorSaved(savedVendor);
      }
    } catch (error) {
      console.error("Error saving vendor:", error);
      toast.error("Failed to save vendor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the vendor's information below."
              : "Enter the details for the new vendor."}
          </DialogDescription>
        </DialogHeader>

        <VendorForm
          defaultValues={
            vendor
              ? {
                name: vendor.name,
                contact_name: vendor.contact_name,
                phone: vendor.phone,
                email: vendor.email || "",
                address: vendor.address || "",
                notes: vendor.notes || "",
              }
              : undefined
          }
          onSubmit={handleSubmit}
          formId={formId}
          vendor={vendor}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting 
              ? (isEditing ? "Updating..." : "Adding...") 
              : (isEditing ? "Update" : "Add") + " Vendor"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VendorDialog;