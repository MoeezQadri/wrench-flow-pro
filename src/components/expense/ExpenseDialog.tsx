import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Expense } from "@/types";
import { nanoid } from "nanoid";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (expense: Expense) => void;
  expense?: Expense;
}

const ExpenseDialog: React.FC<ExpenseDialogProps> = ({ open, onOpenChange, onSave, expense }) => {
  const [formData, setFormData] = useState({
    date: expense?.date ? new Date(expense.date) : new Date(),
    amount: expense?.amount || 0,
    category: expense?.category || '',
    description: expense?.description || '',
    paymentMethod: expense?.payment_method || 'cash' as const,
    vendor_name: expense?.vendor_name || '',
    vendorId: expense?.vendor_id || ''
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        date: expense.date ? new Date(expense.date) : new Date(),
        amount: expense.amount || 0,
        category: expense.category || '',
        description: expense.description || '',
        paymentMethod: expense.payment_method || 'cash' as const,
        vendor_name: expense.vendor_name || '',
        vendorId: expense.vendor_id || ''
      });
    }
  }, [expense]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (e: any) => {
    setFormData(prev => ({ ...prev, date: e }));
  };

  const handleSave = () => {
    const expenseData: Expense = {
      id: expense?.id || nanoid(),
      date: formData.date.toISOString().split('T')[0],
      amount: formData.amount,
      category: formData.category,
      description: formData.description,
      payment_method: formData.paymentMethod,
      vendor_name: formData.vendor_name,
      vendor_id: formData.vendorId || undefined,
      created_at: expense?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    onSave(expenseData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit Expense" : "Add Expense"}</DialogTitle>
          <DialogDescription>
            {expense ? "Edit the expense details." : "Enter the details for the new expense."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                id="date"
                value={formData.date.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange(new Date(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                type="number"
                id="amount"
                value={formData.amount}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={formData.paymentMethod} onValueChange={(value) => handleSelectChange("paymentMethod", value)}>
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="vendor_name">Vendor Name</Label>
            <Input
              id="vendor_name"
              value={formData.vendor_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="vendorId">Vendor ID</Label>
            <Input
              id="vendorId"
              value={formData.vendorId}
              onChange={handleChange}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseDialog;
