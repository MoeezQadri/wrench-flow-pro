
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
import { generateId, getVendorById } from "@/services/data-service";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (expense: Expense) => void;
  expense?: Expense;
}

const ExpenseDialog = ({ open, onOpenChange, onSave, expense }: ExpenseDialogProps) => {
  const isEditing = !!expense;
  const formId = "expense-form";

  const handleSubmit = async (data: ExpenseFormValues) => {
    try {
      // Only attempt to get vendor if vendorId is provided and not "none"
      let vendorName = "";
      if (data.vendorId && data.vendorId !== "none") {
        const vendor = await getVendorById(data.vendorId);
        vendorName = vendor?.name || "";
      }
      
      const newExpense: Expense = {
        id: expense?.id || generateId("expense"),
        date: data.date.toISOString().split('T')[0], // format as YYYY-MM-DD
        category: data.category,
        amount: data.amount,
        description: data.description,
        payment_method: data.paymentMethod,
        payment_status: 'pending', // Add default payment status
        vendor_id: data.vendorId !== "none" ? data.vendorId : undefined,
        vendor_name: vendorName,
      };
      
      onSave(newExpense);
      toast.success(`Expense ${isEditing ? "updated" : "added"} successfully!`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense. Please try again.");
    }
  };

  // Convert string date to Date object for the form
  const getDateFromString = (dateString?: string) => {
    if (!dateString) return new Date();
    return new Date(dateString);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Expense" : "Add New Expense"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the expense information below."
              : "Enter the details for the new expense."}
          </DialogDescription>
        </DialogHeader>

        <ExpenseForm
          defaultValues={
            expense
              ? {
                  date: getDateFromString(expense.date),
                  category: expense.category,
                  amount: expense.amount,
                  description: expense.description,
                  paymentMethod: expense.payment_method,
                  vendorId: expense.vendor_id || "none",
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
            {isEditing ? "Update" : "Add"} Expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseDialog;
