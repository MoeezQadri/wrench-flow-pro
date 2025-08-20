
import React, { useState, useEffect } from "react";
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
import { Part, Expense, Vendor } from "@/types";
import PartForm, { PartFormValues } from "./PartForm";
import { generateId } from "@/services/data-service";
import { useDataContext } from "@/context/data/DataContext";

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
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(invoiceId ? true : false);

  const {
    getInvoiceById,
    vendors,
    addExpense
  } = useDataContext()

  useEffect(() => {
    if (invoiceId) {
      const fetchInvoice = async () => {
        try {
          setLoading(true);
          const data = await getInvoiceById(invoiceId);
          setInvoice(data);
        } catch (error) {
          console.error("Error fetching invoice:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchInvoice();
    } else {
      setInvoice(null);
    }
  }, [invoiceId]);

  const handleSubmit = async (data: PartFormValues) => {
    try {
      // Vendor is now required, so always use it
      const vendorId = data.vendorId;

      const newPart: Part = {
        id: part?.id || generateId("part"),
        name: data.name,
        price: data.price,
        quantity: data.quantity,
        description: data.description,
        vendor_id: vendorId,
        part_number: data.partNumber,
        invoice_ids: data.invoiceIds || [],
      };

      onSave(newPart);

      // Create expense for part purchase
      if (vendorId && !isEditing) {
        const vendor = vendors.find((v: Vendor) => v.id === vendorId);
        const expense: Expense = {
          id: generateId("expense"),
          category: "parts",
          description: `Purchase: ${newPart.name}`,
          amount: newPart.price * newPart.quantity,
          date: new Date().toISOString(),
          vendor_id: vendorId,
          vendor_name: vendor?.name,
          payment_method: "cash",
          payment_status: "paid",
          invoice_id: invoiceId || undefined,
        };
        
        try {
          await addExpense(expense);
        } catch (error) {
          console.error("Error creating expense for part purchase:", error);
          toast.error("Part added but failed to create expense entry");
        }
      }

      // If the part is being added to an invoice, show a specialized message
      if (invoiceId && invoice) {
        const vehicleInfo = invoice.vehicleInfo;
        const customerName = vehicleInfo ? `${vehicleInfo.make} ${vehicleInfo.model}` : "customer";
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

  if (loading) {
    return null; // or render a loading indicator
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Part" : "Add New Part"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the part information below."
              : invoice
                ? `Add a new part to invoice #${invoiceId?.substring(0, 8)}.`
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
                vendorId: part.vendor_id || "",
                partNumber: part.part_number,
                invoiceIds: part.invoice_ids || [],
              }
              : undefined
          }
          onSubmit={handleSubmit}
          formId={formId}
          invoice={invoice}
          invoiceId={invoiceId}
          part={part}
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
