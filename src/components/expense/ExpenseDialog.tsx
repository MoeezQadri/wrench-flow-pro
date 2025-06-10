
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
import { nanoid } from "nanoid";
import ExpenseForm, { ExpenseFormValues } from "./ExpenseForm";

const generateId = (prefix: string = 'expense'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (expense: Expense) => void;
  expense?: Expense;
}

const ExpenseDialog: React.FC<ExpenseDialogProps> = ({ open, onOpenChange, onSave, expense }) => {
  const isEditing = !!expense;
  const formId = "expense-form";

  const handleSubmit = async (data: ExpenseFormValues) => {
    try {
      const expenseData: Expense = {
        id: expense?.id || generateId("expense"),
        date: data.date.toISOString().split('T')[0],
        amount: data.amount,
        category: data.category,
        description: data.description,
        payment_method: data.paymentMethod,
        vendor_name: data.vendorId && data.vendorId !== "none" ? 
          // This would need to be looked up from vendors list
          "" : undefined,
        vendor_id: data.vendorId && data.vendorId !== "none" ? data.vendorId : undefined,
        created_at: expense?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      onSave(expenseData);
      toast.success(isEditing ? "Expense updated successfully!" : "Expense added successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Expense" : "Add Expense"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the expense details below." : "Enter the details for the new expense."}
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
