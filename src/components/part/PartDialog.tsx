
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
import { Part } from "@/types";
import PartForm, { PartFormValues } from "./PartForm";
import { generateId, getVendorById } from "@/services/data-service";

interface PartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (part: Part) => void;
  part?: Part;
}

const PartDialog = ({ open, onOpenChange, onSave, part }: PartDialogProps) => {
  const isEditing = !!part;
  const formId = "part-form";

  const handleSubmit = (data: PartFormValues) => {
    try {
      const vendor = data.vendorId ? getVendorById(data.vendorId) : undefined;
      
      const newPart: Part = {
        id: part?.id || generateId("part"),
        name: data.name,
        price: data.price,
        quantity: data.quantity,
        description: data.description,
        vendorId: data.vendorId,
        vendorName: vendor?.name,
        partNumber: data.partNumber,
        reorderLevel: data.reorderLevel,
      };
      
      onSave(newPart);
      toast.success(`Part ${isEditing ? "updated" : "added"} successfully!`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving part:", error);
      toast.error("Failed to save part. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Part" : "Add New Part"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the part information below."
              : "Enter the details for the new part."}
          </DialogDescription>
        </DialogHeader>

        <PartForm
          defaultValues={
            part
              ? {
                  name: part.name,
                  price: part.price,
                  quantity: part.quantity,
                  description: part.description,
                  vendorId: part.vendorId,
                  partNumber: part.partNumber,
                  reorderLevel: part.reorderLevel,
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
            {isEditing ? "Update" : "Add"} Part
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PartDialog;
