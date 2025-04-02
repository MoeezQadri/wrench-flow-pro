import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  payments, 
  expenses, 
  getPaymentsByDateRange, 
  getExpensesByDateRange 
} from "@/services/data-service";
import { format } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Download, Filter, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import ExpenseDialog from "@/components/expense/ExpenseDialog";
import { Expense } from "@/types";

const FinanceReport = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startDate, setStartDate] = useState(format(new Date(new Date().setDate(new Date().getDate() - 7)), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);

  // Get payments and expenses for the selected date
  const dailyPayments = payments.filter(payment => payment.date === selectedDate);
  const dailyExpenses = expenses.filter(expense => expense.date === selectedDate);
  
  // Calculate daily totals
  const dailyIncome = dailyPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const dailyExpenseTotal = dailyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const dailyProfit = dailyIncome - dailyExpenseTotal;
  
  // Get date range data
  const rangePayments = getPaymentsByDateRange(startDate, endDate);
  const rangeExpenses = getExpensesByDateRange(startDate, endDate);
  
  // Calculate range totals
  const rangeIncome = rangePayments.reduce((sum, payment) => sum + payment.amount, 0);
  const rangeExpenseTotal = rangeExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const rangeProfit = rangeIncome - rangeExpenseTotal;
  
  // Create chart data - daily expenses by category
  const expensesByCategory = {};
  dailyExpenses.forEach(expense => {
    if (!expensesByCategory[expense.category]) {
      expensesByCategory[expense.category] = 0;
    }
    expensesByCategory[expense.category] += expense.amount;
  });
  
  const expenseChartData = Object.keys(expensesByCategory).map(category => ({
    name: category,
    amount: expensesByCategory[category]
  }));
  
  // Create weekly trend data (mock data - in real app would come from API)
  const weeklyTrendData = [
    { day: "Mon", income: 850, expenses: 320, profit: 530 },
    { day: "Tue", income: 740, expenses: 280, profit: 460 },
    { day: "Wed", income: 920, expenses: 400, profit: 520 },
    { day: "Thu", income: 1100, expenses: 450, profit: 650 },
    { day: "Fri", income: 1250, expenses: 520, profit: 730 },
    { day: "Sat", income: 950, expenses: 380, profit: 570 },
    { day: "Sun", income: 750, expenses: 250, profit: 500 }
  ];

  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(format(date, "yyyy-MM-dd"));
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(format(date, "yyyy-MM-dd"));
  };

  // Handler for saving a new expense
  const handleSaveExpense = (expense: Expense) => {
    console.log('New expense saved:', expense);
    // In a real application, this would send the expense to the server
    // For now, let's just close the dialog and refresh data would happen on the next API call
    setIsExpenseDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/reports">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Reports
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Finance Report</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => setIsExpenseDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handlePreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center border rounded-md px-3 py-1">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{selectedDate}</span>
            </div>
            <Button variant="outline" size="icon" onClick={handleNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Daily Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dailyIncome.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Daily Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dailyExpenseTotal.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Daily Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${dailyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${dailyProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Date Range Summary */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Range Income</CardTitle>
            <CardDescription>{startDate} - {endDate}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${rangeIncome.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Range Expenses</CardTitle>
            <CardDescription>{startDate} - {endDate}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${rangeExpenseTotal.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Range Profit</CardTitle>
            <CardDescription>{startDate} - {endDate}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${rangeProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${rangeProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts and Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Expense Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Expenses by category for {selectedDate}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {expenseChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="amount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No expenses for this date</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Weekly Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Trend</CardTitle>
            <CardDescription>Income, expenses, and profit for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#82ca9d" strokeWidth={2} />
                  <Line type="monotone" dataKey="expenses" stroke="#e48a8a" strokeWidth={2} />
                  <Line type="monotone" dataKey="profit" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Daily Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Daily Transactions</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Payments */}
              {dailyPayments.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">Payment</TableCell>
                  <TableCell>Income</TableCell>
                  <TableCell className="text-right text-green-600">${payment.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              
              {/* Expenses */}
              {dailyExpenses.map(expense => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>Expense</TableCell>
                  <TableCell className="text-right text-red-600">${expense.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              
              {/* Total Row */}
              <TableRow>
                <TableCell colSpan={2} className="text-right font-bold">Total</TableCell>
                <TableCell className={`text-right font-bold ${dailyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${dailyProfit.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expense Dialog */}
      <ExpenseDialog
        open={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        onSave={handleSaveExpense}
      />
    </div>
  );
};

export default FinanceReport;
