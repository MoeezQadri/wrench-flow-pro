
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  invoices, 
  tasks, 
  getCustomerById,
  calculateInvoiceTotal 
} from "@/services/data-service";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar, ChevronLeft, ChevronRight, Download, Filter, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";
import { format } from "date-fns";

const InvoicingReport = () => {
  const [startDate, setStartDate] = useState("2023-05-01");
  const [endDate, setEndDate] = useState("2023-05-31");
  
  // Filter invoices by date range
  const filteredInvoices = invoices.filter(
    invoice => invoice.date >= startDate && invoice.date <= endDate
  );

  // Calculate invoice status counts
  const openCount = filteredInvoices.filter(inv => inv.status === 'open').length;
  const inProgressCount = filteredInvoices.filter(inv => inv.status === 'in-progress').length;
  const completedCount = filteredInvoices.filter(inv => inv.status === 'completed').length;
  const paidCount = filteredInvoices.filter(inv => inv.status === 'paid').length;
  const partialCount = filteredInvoices.filter(inv => inv.status === 'partial').length;
  const totalInvoices = filteredInvoices.length;

  // Calculate financial metrics
  const totalValue = filteredInvoices.reduce((sum, invoice) => {
    const { total } = calculateInvoiceTotal(invoice);
    return sum + total;
  }, 0);

  const totalPaid = filteredInvoices.reduce((sum, invoice) => {
    return sum + invoice.payments.reduce((pSum, payment) => pSum + payment.amount, 0);
  }, 0);

  const totalOutstanding = totalValue - totalPaid;

  // Task metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const taskCompletionRate = Math.round((completedTasks / totalTasks) * 100);

  const completedTasksWithHours = tasks.filter(
    task => task.status === 'completed' && task.hoursSpent !== undefined
  );
  
  let efficiency = 0;
  if (completedTasksWithHours.length > 0) {
    const totalEstimated = completedTasksWithHours.reduce((sum, task) => sum + task.hoursEstimated, 0);
    const totalSpent = completedTasksWithHours.reduce((sum, task) => sum + (task.hoursSpent || 0), 0);
    efficiency = Math.round((totalEstimated / totalSpent) * 100);
  }

  // Data for invoice status chart
  const invoiceStatusData = [
    { name: 'Open', value: openCount, color: '#EAB308' },
    { name: 'In Progress', value: inProgressCount, color: '#3B82F6' },
    { name: 'Completed', value: completedCount, color: '#22C55E' },
    { name: 'Paid', value: paidCount, color: '#8B5CF6' },
    { name: 'Partial', value: partialCount, color: '#F97316' }
  ];

  const handlePreviousMonth = () => {
    const start = new Date(startDate);
    start.setMonth(start.getMonth() - 1);
    setStartDate(format(start, "yyyy-MM-dd"));
    
    const end = new Date(endDate);
    end.setMonth(end.getMonth() - 1);
    setEndDate(format(end, "yyyy-MM-dd"));
  };

  const handleNextMonth = () => {
    const start = new Date(startDate);
    start.setMonth(start.getMonth() + 1);
    setStartDate(format(start, "yyyy-MM-dd"));
    
    const end = new Date(endDate);
    end.setMonth(end.getMonth() + 1);
    setEndDate(format(end, "yyyy-MM-dd"));
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
          <h1 className="text-3xl font-bold tracking-tight">Invoicing Summary</h1>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center border rounded-md px-3 py-1">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{startDate} to {endDate}</span>
          </div>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Task Metrics */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Task Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">{completedTasks} of {totalTasks} tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Task Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{efficiency}%</div>
            <p className="text-xs text-muted-foreground">Est. vs actual hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total invoice value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalOutstanding.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Yet to be collected</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Invoice Status Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Status Distribution</CardTitle>
          <CardDescription>Breakdown of invoices by status for selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={invoiceStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} invoices`, 'Count']} />
                <Bar dataKey="value" fill="#8884d8">
                  {invoiceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Invoices</CardTitle>
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
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => {
                const customer = getCustomerById(invoice.customerId);
                const { total } = calculateInvoiceTotal(invoice);
                
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id.split('-')[1]}</TableCell>
                    <TableCell>{customer?.name || "Unknown"}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>
                      <StatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell>{invoice.items.length} items</TableCell>
                    <TableCell className="text-right">${total.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicingReport;
