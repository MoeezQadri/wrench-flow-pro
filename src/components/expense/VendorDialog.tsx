
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
import VendorForm, { VendorFormValues } from "../vendor/VendorForm";
import { useDataContext } from "@/context/data/DataContext";

interface VendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorAdded?: (vendor: Vendor) => void;
}

const VendorDialog = ({ open, onOpenChange, onVendorAdded }: VendorDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formId = "vendor-form";
  const { addVendor } = useDataContext();

  const handleSubmit = async (data: VendorFormValues) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
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

      const addedVendor = await addVendor(newVendor);
      toast.success("Vendor added successfully!");

      if (onVendorAdded && addedVendor) {
        onVendorAdded(addedVendor);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error adding vendor:", error);
      toast.error("Failed to add vendor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>
            Enter vendor details below.
          </DialogDescription>
        </DialogHeader>

        <VendorForm
          onSubmit={handleSubmit}
          formId={formId}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Vendor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VendorDialog;
