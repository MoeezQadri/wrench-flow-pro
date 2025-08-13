import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  FileText,
  AlertTriangle,
  Download,
  Calendar
} from 'lucide-react';
import { useDataContext } from '@/context/data/DataContext';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';

const FinancialReport = () => {
  const { invoices, expenses, vendors } = useDataContext();
  const { formatCurrency } = useOrganizationSettings();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  });
  
  // Separate state for the actual applied filters
  const [appliedDateRange, setAppliedDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Filter data based on applied date range
  const filterByDateRange = (items: any[], dateField: string) => {
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= appliedDateRange.startDate && itemDate <= appliedDateRange.endDate;
    });
  };

  // Calculate receivables (unpaid invoices) within date range
  const filteredInvoices = filterByDateRange(invoices, 'date');
  const receivables = filteredInvoices.filter(inv => inv.status !== 'paid');
  const totalReceivables = receivables.reduce((sum, inv) => {
    // Use a default calculation or existing amount field
    const amount = 1000; // Placeholder - would normally calculate from invoice items
    return sum + amount;
  }, 0);

  // Calculate overdue receivables
  const overdueReceivables = receivables.filter(inv => {
    if (!inv.due_date) return false;
    return new Date(inv.due_date) < new Date();
  });

  // Calculate payables from expenses (unpaid expenses) within date range
  const filteredExpenses = filterByDateRange(expenses, 'date');
  const payables = filteredExpenses.filter(exp => exp.payment_status !== 'paid');
  const totalPayables = payables.reduce((sum, exp) => sum + exp.amount, 0);

  // Calculate overdue payables (expenses past 30 days)
  const overduePayables = payables.filter(exp => {
    const expenseDate = new Date(exp.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return expenseDate < thirtyDaysAgo;
  });

  const netPosition = totalReceivables - totalPayables;

  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    setDateRange({ startDate, endDate });
  };

  const handleApplyFilters = async () => {
    setIsLoading(true);
    // Simulate loading time
    setTimeout(() => {
      setAppliedDateRange(dateRange);
      setIsLoading(false);
    }, 500);
  };

  const hasUnappliedChanges = 
    dateRange.startDate.getTime() !== appliedDateRange.startDate.getTime() ||
    dateRange.endDate.getTime() !== appliedDateRange.endDate.getTime();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Report</h1>
          <p className="text-muted-foreground">Receivables, payables and cash flow analysis</p>
          <div className="text-sm text-muted-foreground mt-1">
            Period: {appliedDateRange.startDate.toLocaleDateString()} - {appliedDateRange.endDate.toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Date Filter Section */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">Filter by date range:</span>
              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onRangeChange={handleDateRangeChange}
              />
              <Button 
                onClick={handleApplyFilters} 
                disabled={!hasUnappliedChanges || isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Applying...
                  </>
                ) : (
                  'Apply Filters'
                )}
              </Button>
            </div>
            {hasUnappliedChanges && (
              <div className="text-sm text-amber-600 font-medium">
                Click "Apply Filters" to update the report
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receivables</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalReceivables)}
            </div>
            <p className="text-xs text-muted-foreground">
              {receivables.length} outstanding invoice{receivables.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payables</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalPayables)}
            </div>
            <p className="text-xs text-muted-foreground">
              {payables.length} unpaid expense{payables.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Position</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netPosition)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current financial position
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendors.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Total vendor relationships
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(overdueReceivables.length > 0 || overduePayables.length > 0) && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-600 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Financial Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overdueReceivables.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800">Overdue Receivables</h4>
                <p className="text-sm text-yellow-600">
                  {overdueReceivables.length} overdue invoice{overdueReceivables.length !== 1 ? 's' : ''} totaling {formatCurrency(overdueReceivables.reduce((sum, inv) => sum + 1000, 0))}
                </p>
              </div>
            )}
            {overduePayables.length > 0 && (
              <div className="p-3 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800">Aging Payables</h4>
                <p className="text-sm text-red-600">
                  {overduePayables.length} expense{overduePayables.length !== 1 ? 's' : ''} over 30 days old totaling {formatCurrency(overduePayables.reduce((sum, exp) => sum + exp.amount, 0))}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Reports */}
      <Tabs defaultValue="receivables" className="w-full">
        <TabsList>
          <TabsTrigger value="receivables">Receivables</TabsTrigger>
          <TabsTrigger value="payables">Payables</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
        </TabsList>
        
        <TabsContent value="receivables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Receivables</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Days Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivables.map((invoice) => {
                    const daysOverdue = invoice.due_date 
                      ? Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 3600 * 24)))
                      : 0;
                    
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>Customer {invoice.customer_id.slice(0, 8)}</TableCell>
                        <TableCell>{formatCurrency(1000)}</TableCell> {/* Placeholder amount */}
                        <TableCell>{formatDate(invoice.due_date)}</TableCell>
                        <TableCell>
                          <Badge variant={daysOverdue > 0 ? 'destructive' : 'secondary'}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {daysOverdue > 0 ? `${daysOverdue} days` : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Payables</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Age (Days)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payables.map((expense) => {
                    const ageInDays = Math.floor((new Date().getTime() - new Date(expense.date).getTime()) / (1000 * 3600 * 24));
                    
                    return (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">
                          {expense.description || 'N/A'}
                        </TableCell>
                        <TableCell>{expense.vendor_name || 'N/A'}</TableCell>
                        <TableCell>{formatCurrency(expense.amount)}</TableCell>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{expense.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={ageInDays > 30 ? 'text-red-600' : ''}>
                            {ageInDays} days
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Total Expenses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((vendor) => {
                    const vendorExpenses = expenses.filter(exp => exp.vendor_id === vendor.id);
                    const totalExpenses = vendorExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                    
                    return (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                        <TableCell>{vendor.contact_name || 'N/A'}</TableCell>
                        <TableCell>{vendor.phone || 'N/A'}</TableCell>
                        <TableCell>{vendor.category || 'N/A'}</TableCell>
                        <TableCell>{formatCurrency(totalExpenses)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium text-green-600">Money Coming In</h3>
                    <p className="text-2xl font-bold">{formatCurrency(totalReceivables)}</p>
                    <p className="text-sm text-muted-foreground">Outstanding receivables</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium text-red-600">Money Going Out</h3>
                    <p className="text-2xl font-bold">{formatCurrency(totalPayables)}</p>
                    <p className="text-sm text-muted-foreground">Outstanding payables</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className={`font-medium ${netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Net Cash Flow
                    </h3>
                    <p className="text-2xl font-bold">{formatCurrency(netPosition)}</p>
                    <p className="text-sm text-muted-foreground">Projected net position</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialReport;