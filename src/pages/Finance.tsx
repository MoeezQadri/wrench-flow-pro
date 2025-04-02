import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  DollarSign, 
  Download, 
  Filter,
  Wallet,
  Plus
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/StatusBadge";
import { 
  calculateInvoiceTotal, 
  expenses, 
  getCustomers, 
  getExpensesByDateRange, 
  getPartExpenses, 
  getPayables, 
  getPaymentsByDateRange, 
  getReceivables, 
  invoices, 
  payments 
} from "@/services/data-service";
import { InvoiceStatus, Expense } from "@/types";
import ExpenseDialog from "@/components/expense/ExpenseDialog";

// Define types for payable and receivable items
type PayableItem = {
  id: string;
  date: string;
  description: string;
  type: "Payable";
  category: string;
  amount: number;
  method: 'cash' | 'card' | 'bank-transfer';
  vendorId?: string;
  vendorName?: string;
};

type ReceivableItem = {
  id: string;
  date: string;
  description: string;
  type: "Receivable";
  status: InvoiceStatus;
  amount: number;
  totalAmount: number;
  paidAmount: number;
  customerId: string;
  customerName: string;
};

type FinanceItem = PayableItem | ReceivableItem;

// Type guards
const isReceivable = (item: FinanceItem): item is ReceivableItem => {
  return item.type === "Receivable";
};

const isPayable = (item: FinanceItem): item is PayableItem => {
  return item.type === "Payable";
};

const Finance = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startDate, setStartDate] = useState(format(new Date(new Date().setDate(new Date().getDate() - 7)), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [activeTab, setActiveTab] = useState("overview");
  const [showPayablesReceivables, setShowPayablesReceivables] = useState<'all' | 'payables' | 'receivables'>('all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  
  // Get all customers for filtering
  const customers = getCustomers();
  
  // Filter transactions by date
  const dateInvoices = invoices.filter(inv => inv.date === selectedDate);
  const dateExpenses = expenses.filter(exp => exp.date === selectedDate);
  const datePayments = payments.filter(payment => payment.date === selectedDate);
  
  // Get date range data for reports
  const rangePayments = getPaymentsByDateRange(startDate, endDate);
  const rangeExpenses = getExpensesByDateRange(startDate, endDate);
  const partExpenses = getPartExpenses().filter(exp => exp.date === selectedDate);
  
  // Calculate daily totals
  const totalIncome = datePayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalExpenses = dateExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netCashflow = totalIncome - totalExpenses;
  
  // Calculate cash-in-hand (simplified for mock data)
  const cashInHand = 10000 + netCashflow; // Assuming starting cash balance is 10,000
  
  // Get receivables and payables
  const receivables = getReceivables();
  const payables = getPayables();
  
  const receivablesAmount = receivables.reduce((sum, invoice) => {
    const { total } = calculateInvoiceTotal(invoice);
    const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    return sum + (total - paid);
  }, 0);
  
  const payablesAmount = payables.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Extract unique vendors from expenses
  const vendors = [...new Set(expenses
    .filter(expense => expense.vendorName)
    .map(expense => expense.vendorName))]
    .filter(Boolean) as string[];
  
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
  
  datePayments.forEach(payment => {
    incomeByMethod[payment.method] += payment.amount;
  });
  
  const incomeChartData = Object.keys(incomeByMethod).map(method => ({
    name: method.charAt(0).toUpperCase() + method.slice(1).replace('-', ' '),
    value: incomeByMethod[method]
  }));
  
  // Parts expenses data
  const partsExpenses = partExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Custom formatter for tooltip values
  const formatTooltipValue = (value) => {
    if (typeof value === 'number') {
      return `$${value.toFixed(2)}`;
    }
    return `$${value}`;
  };

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

  const getReceivablesAndPayables = (): FinanceItem[] => {
    let items: FinanceItem[] = [];
    
    // Handle payables
    if (showPayablesReceivables === 'all' || showPayablesReceivables === 'payables') {
      const filteredPayables = payables
        .filter(expense => selectedVendor === 'all' || expense.vendorName === selectedVendor)
        .map(expense => ({
          id: expense.id,
          date: expense.date,
          description: expense.description,
          type: "Payable" as const,
          category: expense.category,
          amount: expense.amount,
          method: expense.paymentMethod,
          vendorId: expense.vendorId,
          vendorName: expense.vendorName
        }));
      
      items = [...items, ...filteredPayables];
    }
    
    // Handle receivables
    if (showPayablesReceivables === 'all' || showPayablesReceivables === 'receivables') {
      const filteredReceivables = receivables
        .filter(invoice => selectedCustomer === 'all' || invoice.customerId === selectedCustomer)
        .map(invoice => {
          const { total } = calculateInvoiceTotal(invoice);
          const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
          const remaining = total - paid;
          const customer = customers.find(c => c.id === invoice.customerId) || { name: 'Unknown Customer' };
          
          return {
            id: invoice.id,
            date: invoice.date,
            description: `Invoice #${invoice.id} for ${invoice.vehicleInfo.make} ${invoice.vehicleInfo.model}`,
            type: "Receivable" as const,
            status: invoice.status,
            amount: remaining,
            totalAmount: total,
            paidAmount: paid,
            customerId: invoice.customerId,
            customerName: customer.name
          };
        });
      
      items = [...items, ...filteredReceivables];
    }
    
    return items.sort((a, b) => a.date.localeCompare(b.date));
  };

  // All financial transactions for the day
  const dayTransactions = [
    ...dateExpenses.map(exp => ({
      id: `exp-${exp.id}`,
      time: "09:45 AM", // Mock time
      description: exp.description,
      type: "Expense",
      category: exp.category,
      method: exp.paymentMethod.charAt(0).toUpperCase() + exp.paymentMethod.slice(1).replace('-', ' '),
      amount: -exp.amount,
      vendorName: exp.vendorName
    })),
    ...datePayments.map(payment => {
      const invoice = invoices.find(inv => inv.id === payment.invoiceId);
      const customer = invoice ? customers.find(c => c.id === invoice.customerId) : null;
      return {
        id: `pay-${payment.id}`,
        time: "02:30 PM", // Mock time
        description: `Payment for Invoice #${payment.invoiceId}`,
        customer: customer ? customer.name : 'Unknown',
        vehicle: invoice ? `${invoice.vehicleInfo.make} ${invoice.vehicleInfo.model}` : 'Unknown',
        type: "Income",
        method: payment.method.charAt(0).toUpperCase() + payment.method.slice(1).replace('-', ' '),
        amount: payment.amount
      };
    })
  ].sort((a, b) => a.time.localeCompare(b.time));

  // Handler for saving a new expense
  const handleSaveExpense = (expense: Expense) => {
    console.log('New expense saved:', expense);
    // In a real application, this would send the expense to the server
    // For now, let's just close the dialog and refresh data would happen on the next API call
    setIsExpenseDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
        <div className="flex items-center mt-4 sm:mt-0 space-x-4">
          <Button 
            onClick={() => setIsExpenseDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="payables">Payables & Receivables</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div></div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <Button variant="outline" size="icon" onClick={handlePreviousDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center border rounded-md px-3 py-1">
                <Calendar className="h-4 w-4 mr-2" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-0 p-0 w-32"
                />
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
          
          {/* Additional Overview Cards */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Receivables</CardTitle>
                <CardDescription>Payments due to you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">${receivablesAmount.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Payables</CardTitle>
                <CardDescription>Payments you need to make</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">${payablesAmount.toFixed(2)}</div>
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
        </TabsContent>
        
        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
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
                  {dayTransactions.length > 0 ? (
                    dayTransactions.map(transaction => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.time}</TableCell>
                        <TableCell className="font-medium">{transaction.description}</TableCell>
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell>{transaction.method}</TableCell>
                        <TableCell className={`text-right font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${Math.abs(transaction.amount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
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
          
          {/* Parts Expense Card */}
          <Card>
            <CardHeader>
              <CardTitle>Parts Expenses</CardTitle>
              <CardDescription>Money spent on parts today</CardDescription>
            </CardHeader>
            <CardContent>
              {partExpenses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partExpenses.map(expense => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell>{expense.paymentMethod.charAt(0).toUpperCase() + expense.paymentMethod.slice(1).replace('-', ' ')}</TableCell>
                        <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} className="text-right font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold">${partsExpenses.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No parts expenses for this date
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Payments Received Card */}
          <Card>
            <CardHeader>
              <CardTitle>Payments Received</CardTitle>
              <CardDescription>Payments for invoices today</CardDescription>
            </CardHeader>
            <CardContent>
              {datePayments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer Vehicle</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datePayments.map(payment => {
                      const invoice = invoices.find(inv => inv.id === payment.invoiceId);
                      return (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">#{payment.invoiceId}</TableCell>
                          <TableCell>
                            {invoice ? `${invoice.vehicleInfo.make} ${invoice.vehicleInfo.model}` : 'Unknown'}
                          </TableCell>
                          <TableCell>{payment.method.charAt(0).toUpperCase() + payment.method.slice(1).replace('-', ' ')}</TableCell>
                          <TableCell>{payment.notes}</TableCell>
                          <TableCell className="text-right text-green-600">${payment.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold text-green-600">${totalIncome.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No payments received today
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Payables & Receivables Tab */}
        <TabsContent value="payables" className="space-y-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-end">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2 flex-1">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant={showPayablesReceivables === 'all' ? 'default' : 'outline'}
                onClick={() => setShowPayablesReceivables('all')}
              >
                All
              </Button>
              <Button
                variant={showPayablesReceivables === 'payables' ? 'default' : 'outline'}
                onClick={() => setShowPayablesReceivables('payables')}
              >
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Payables
              </Button>
              <Button
                variant={showPayablesReceivables === 'receivables' ? 'default' : 'outline'}
                onClick={() => setShowPayablesReceivables('receivables')}
              >
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                Receivables
              </Button>
            </div>
          </div>
          
          {/* Additional filters for vendors and customers */}
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            {(showPayablesReceivables === 'all' || showPayablesReceivables === 'payables') && (
              <div className="grid gap-2 flex-1">
                <Label htmlFor="vendor-filter">Filter by Vendor</Label>
                <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                  <SelectTrigger id="vendor-filter">
                    <SelectValue placeholder="All Vendors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    {vendors.map((vendor, index) => (
                      <SelectItem key={index} value={vendor}>{vendor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {(showPayablesReceivables === 'all' || showPayablesReceivables === 'receivables') && (
              <div className="grid gap-2 flex-1">
                <Label htmlFor="customer-filter">Filter by Customer</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger id="customer-filter">
                    <SelectValue placeholder="All Customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {/* Payables & Receivables Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {showPayablesReceivables === 'payables' 
                    ? 'Payables' 
                    : showPayablesReceivables === 'receivables' 
                      ? 'Receivables' 
                      : 'Payables & Receivables'}
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    {showPayablesReceivables !== 'payables' && <TableHead>Status</TableHead>}
                    {showPayablesReceivables !== 'receivables' && <TableHead>Vendor</TableHead>}
                    {showPayablesReceivables !== 'payables' && <TableHead>Customer</TableHead>}
                    {showPayablesReceivables === 'receivables' && <TableHead>Total</TableHead>}
                    {showPayablesReceivables === 'receivables' && <TableHead>Paid</TableHead>}
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getReceivablesAndPayables().map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.date}</TableCell>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell>
                        <Badge variant={item.type === 'Payable' ? 'outline' : 'secondary'}>
                          {item.type}
                        </Badge>
                      </TableCell>
                      {showPayablesReceivables !== 'payables' && (
                        <TableCell>
                          {isReceivable(item) ? (
                            <StatusBadge status={item.status} />
                          ) : (
                            <span>-</span>
                          )}
                        </TableCell>
                      )}
                      {showPayablesReceivables !== 'receivables' && (
                        <TableCell>
                          {isPayable(item) && item.vendorName ? item.vendorName : '-'}
                        </TableCell>
                      )}
                      {showPayablesReceivables !== 'payables' && (
                        <TableCell>
                          {isReceivable(item) ? item.customerName : '-'}
                        </TableCell>
                      )}
                      {showPayablesReceivables === 'receivables' && (
                        <TableCell>${isReceivable(item) ? item.totalAmount.toFixed(2) : '-'}</TableCell>
                      )}
                      {showPayablesReceivables === 'receivables' && (
                        <TableCell>${isReceivable(item) ? item.paidAmount.toFixed(2) : '-'}</TableCell>
                      )}
                      <TableCell className={`text-right font-medium ${item.type === 'Receivable' ? 'text-blue-600' : 'text-orange-600'}`}>
                        ${item.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {getReceivablesAndPayables().length === 0 && (
                    <TableRow>
                      <TableCell colSpan={showPayablesReceivables === 'receivables' ? 7 : 6} className="text-center py-4 text-muted-foreground">
                        No data found for the selected period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Expense Dialog */}
      <ExpenseDialog
        open={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        onSave={handleSaveExpense}
      />
    </div>
  );
};

export default Finance;
