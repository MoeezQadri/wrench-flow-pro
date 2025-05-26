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
import { generateId, getCurrentUser, hasPermission, getVendorById } from "@/services/data-service";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (expense: Expense) => void;
  expense?: Expense;
}

const ExpenseDialog = ({ open, onOpenChange, onSave, expense }: ExpenseDialogProps) => {
  const isEditing = !!expense;
  const formId = "expense-form";
  const currentUser = getCurrentUser();
  
  // Check if user has permission to manage expenses
  const canManageExpenses = hasPermission(currentUser, 'expenses', 'manage');
  
  if (!canManageExpenses) {
    return null;
  }

  const handleSubmit = async (data: ExpenseFormValues) => {
    try {
      const newExpense: Expense = {
        id: expense?.id || generateId("expense"),
        category: data.category,
        description: data.description,
        amount: data.amount,
        date: data.date,
        payment_method: data.paymentMethod,
        vendor_name: data.vendorName,
        vendor_id: data.vendorId,
        created_at: expense?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      onSave(newExpense);
      toast.success(`Expense ${isEditing ? "updated" : "added"} successfully!`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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
                  category: expense.category,
                  description: expense.description,
                  amount: expense.amount,
                  date: expense.date,
                  paymentMethod: expense.payment_method,
                  vendorName: expense.vendor_name,
                  vendorId: expense.vendor_id,
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
