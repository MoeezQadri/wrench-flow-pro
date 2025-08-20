
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
import { Expense } from "@/types";
import ExpenseForm, { ExpenseFormValues } from "./ExpenseForm";
import { useDataContext } from "@/context/data/DataContext";

// Generate proper UUID for database
const generateId = (): string => {
  return crypto.randomUUID();
};

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (expense: Expense) => void;
  expense?: Expense;
  invoiceId?: string;
}

const ExpenseDialog: React.FC<ExpenseDialogProps> = ({ 
  open, 
  onOpenChange, 
  onSave, 
  expense, 
  invoiceId 
}) => {
  const isEditing = !!expense;
  const formId = "expense-form";
  const { vendors } = useDataContext();

  const handleSubmit = async (data: ExpenseFormValues) => {
    try {
      // Determine expense assignment based on type
      let expenseInvoiceId = undefined;
      let expenseVendorName = undefined;

      if (data.expenseType === "invoice") {
        if (!data.invoiceId) {
          toast.error("Invoice must be selected for invoice expenses");
          return;
        }
        expenseInvoiceId = data.invoiceId;
      }

      // Get vendor name if vendor is selected
      if (data.vendorId && data.vendorId !== "none") {
        const vendor = vendors.find(v => v.id === data.vendorId);
        expenseVendorName = vendor?.name;
      }

      const expenseData: Expense = {
        id: expense?.id || generateId(),
        date: data.date.toISOString().split('T')[0],
        amount: data.amount,
        category: data.category,
        description: data.description,
        payment_method: data.paymentMethod,
        vendor_name: expenseVendorName,
        vendor_id: data.vendorId && data.vendorId !== "none" ? data.vendorId : undefined,
        created_at: expense?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add invoice_id if this is an invoice expense
      if (expenseInvoiceId) {
        (expenseData as any).invoice_id = expenseInvoiceId;
      }

      onSave(expenseData);

      // Show success message based on expense type
      if (data.expenseType === "invoice") {
        toast.success(`Invoice expense ${isEditing ? "updated" : "added"} successfully!`);
      } else {
        toast.success(`Workshop expense ${isEditing ? "updated" : "added"} successfully!`);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense. Please try again.");
    }
  };

  // Determine expense type for editing
  const getExpenseType = (expense?: Expense) => {
    if (!expense) return invoiceId ? "invoice" : "workshop";
    return (expense as any).invoice_id ? "invoice" : "workshop";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Expense" : "Add Expense"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the expense details below." 
              : invoiceId 
                ? "Add a new expense for the selected invoice."
                : "Create either an invoice-related expense or a general workshop expense."
            }
          </DialogDescription>
        </DialogHeader>

        <ExpenseForm
          defaultValues={
            expense
              ? {
                date: new Date(expense.date),
                category: expense.category,
                amount: expense.amount,
                description: expense.description,
                paymentMethod: expense.payment_method,
                expenseType: getExpenseType(expense),
                vendorId: expense.vendor_id || "none",
                invoiceId: (expense as any).invoice_id || "",
              }
              : {
                expenseType: invoiceId ? "invoice" : "workshop",
                invoiceId: invoiceId || "",
              }
          }
          onSubmit={handleSubmit}
          formId={formId}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId}>
            {isEditing ? "Update" : "Add"} Expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseDialog;
