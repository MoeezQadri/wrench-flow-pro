
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
import { generateId, getVendorById, getInvoiceById } from "@/services/data-service";

interface PartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (part: Part) => void;
  part?: Part;
  invoiceId?: string;
}

const PartDialog = ({ open, onOpenChange, onSave, part, invoiceId }: PartDialogProps) => {
  const isEditing = !!part;
  const formId = "part-form";
  const invoice = invoiceId ? getInvoiceById(invoiceId) : undefined;

  const handleSubmit = (data: PartFormValues) => {
    try {
      // Only look up vendor if vendorId is provided and not "none"
      const vendorId = data.vendorId !== "none" ? data.vendorId : undefined;
      const vendor = vendorId ? getVendorById(vendorId) : undefined;
      
      const newPart: Part = {
        id: part?.id || generateId("part"),
        name: data.name,
        price: data.price,
        quantity: data.quantity,
        description: data.description,
        vendorId: vendorId,
        vendorName: vendor?.name,
        partNumber: data.partNumber,
      };
      
      onSave(newPart);
      
      // If the part is being added to an invoice, show a specialized message
      if (invoiceId && invoice) {
        const customerName = invoice.vehicleInfo.make + " " + invoice.vehicleInfo.model;
        toast.success(`Part ${isEditing ? "updated" : "added"} and associated with invoice for ${customerName}!`);
      } else {
        toast.success(`Part ${isEditing ? "updated" : "added"} successfully!`);
      }
      
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
              : invoice 
                ? `Add a new part to invoice #${invoiceId}.` 
                : "Enter the details for the new part."
            }
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
                  vendorId: part.vendorId || "none",
                  partNumber: part.partNumber,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          formId={formId}
          invoiceId={invoiceId}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId}>
            {isEditing ? "Update" : "Add"} Part {invoice ? "to Invoice" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PartDialog;
