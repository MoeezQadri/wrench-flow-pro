
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Plus, 
  Pencil, 
  DollarSign, 
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  Banknote,
  Building
} from "lucide-react";
import { toast } from "sonner";
import ExpenseDialog from "@/components/expense/ExpenseDialog";
import { Expense } from "@/types";
import { format, isThisMonth, isToday, parseISO } from "date-fns";

const Expenses = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>(undefined);
  const [expensesList, setExpensesList] = useState<Expense[]>([]);

  const handleAddExpense = () => {
    setSelectedExpense(undefined);
    setIsDialogOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDialogOpen(true);
  };

  const handleSaveExpense = (expense: Expense) => {
    setExpensesList(prev => {
      const index = prev.findIndex(e => e.id === expense.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = expense;
        return updated;
      } else {
        return [...prev, expense];
      }
    });
  };

  // Calculate expenses for different time periods
  const todayExpenses = expensesList.filter(expense => isToday(parseISO(expense.date)));
  const monthExpenses = expensesList.filter(expense => isThisMonth(parseISO(expense.date)));
  
  const totalToday = todayExpenses.reduce((total, expense) => total + expense.amount, 0);
  const totalMonth = monthExpenses.reduce((total, expense) => total + expense.amount, 0);
  const totalAll = expensesList.reduce((total, expense) => total + expense.amount, 0);

  // Get payment method icon
  const getPaymentMethodIcon = (method: 'cash' | 'card' | 'bank-transfer') => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4 text-yellow-500" />;
      case 'card':
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case 'bank-transfer':
        return <Building className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <Button onClick={handleAddExpense}>
          <Plus className="mr-1 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Expenses</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalToday.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {todayExpenses.length} transactions today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMonth.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {monthExpenses.length} transactions this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAll.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {expensesList.length} total transactions
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Expense History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expensesList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{format(parseISO(expense.date), "MMM dd, yyyy")}</TableCell>
                  <TableCell>
                    <div className="font-medium">{expense.category}</div>
                  </TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getPaymentMethodIcon(expense.payment_method)}
                      <span className="ml-2 capitalize">
                        {expense.payment_method.replace('-', ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{expense.vendor_name || "—"}</TableCell>
                  <TableCell className="font-medium">${expense.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditExpense(expense)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {expensesList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <DollarSign className="w-12 h-12 mb-2 text-muted-foreground/60" />
                      <p>No expenses found</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={handleAddExpense}
                      >
                        Add your first expense
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ExpenseDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveExpense}
        expense={selectedExpense}
      />
    </div>
  );
};

export default Expenses;
