
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { expenses, invoices, calculateInvoiceTotal } from "@/services/data-service";
import { Calendar, ChevronLeft, ChevronRight, Download, Filter } from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip as RechartsTooltip
} from 'recharts';

const FinanceReport = () => {
  const [selectedDate, setSelectedDate] = useState("2023-05-15");
  
  // Filter transactions by date (using basic example since we don't have real dates for transactions)
  const dateInvoices = invoices.filter(inv => inv.date === selectedDate);
  const dateExpenses = expenses.filter(exp => exp.date === selectedDate);
  
  // Calculate daily totals
  const totalIncome = dateInvoices.reduce((sum, invoice) => {
    const { total } = calculateInvoiceTotal(invoice);
    return sum + (invoice.status === 'paid' ? total : 0);
  }, 0);
  
  const totalExpenses = dateExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netCashflow = totalIncome - totalExpenses;
  
  // Calculate cash-in-hand (simplified for mock data)
  const cashInHand = 10000 + netCashflow; // Assuming starting cash balance is 10,000
  
  // Expense categories for chart
  const expenseByCategory = {};
  dateExpenses.forEach(expense => {
    if (!expenseByCategory[expense.category]) {
      expenseByCategory[expense.category] = 0;
    }
    expenseByCategory[expense.category] += expense.amount;
  });
  
  const expenseChartData = Object.keys(expenseByCategory).map(category => ({
    name: category,
    value: expenseByCategory[category]
  }));
  
  // Income by payment method
  const incomeByMethod = {
    cash: 0,
    card: 0,
    'bank-transfer': 0
  };
  
  dateInvoices.forEach(invoice => {
    if (invoice.status === 'paid') {
      invoice.payments.forEach(payment => {
        incomeByMethod[payment.method] += payment.amount;
      });
    }
  });
  
  const incomeChartData = Object.keys(incomeByMethod).map(method => ({
    name: method.charAt(0).toUpperCase() + method.slice(1).replace('-', ' '),
    value: incomeByMethod[method]
  }));
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  // Custom formatter for tooltip values
  const formatTooltipValue = (value) => {
    if (typeof value === 'number') {
      return `$${value.toFixed(2)}`;
    }
    return `$${value}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold tracking-tight">Finance Report</h1>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
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
      
      {/* Daily Summary */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Net Cashflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netCashflow.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cash in Hand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${cashInHand.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>By category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {expenseChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {expenseChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={formatTooltipValue} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No expenses for this date</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Income by Payment Method</CardTitle>
            <CardDescription>Cash, card, and bank transfers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {totalIncome > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {incomeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={formatTooltipValue} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No income for this date</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Transactions Table */}
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
                <TableHead>Time</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Example transactions - in a real app, we'd merge and sort invoices and expenses */}
              {[
                ...dateExpenses.map(exp => ({
                  id: `exp-${exp.id}`,
                  time: "09:45 AM", // Mock time
                  description: exp.description,
                  type: "Expense",
                  method: exp.paymentMethod.charAt(0).toUpperCase() + exp.paymentMethod.slice(1).replace('-', ' '),
                  amount: -exp.amount
                })),
                ...dateInvoices
                  .filter(inv => inv.status === 'paid')
                  .flatMap(inv => inv.payments.map(payment => ({
                    id: `pay-${payment.id}`,
                    time: "02:30 PM", // Mock time
                    description: `Payment for Invoice #${inv.id}`,
                    type: "Income",
                    method: payment.method.charAt(0).toUpperCase() + payment.method.slice(1).replace('-', ' '),
                    amount: payment.amount
                  })))
              ]
                .sort((a, b) => a.time.localeCompare(b.time))
                .map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.time}</TableCell>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>{transaction.method}</TableCell>
                    <TableCell className={`text-right font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              {dateExpenses.length === 0 && dateInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No transactions for this date
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceReport;
