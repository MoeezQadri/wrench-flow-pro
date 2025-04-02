
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { invoices, getInvoiceById, customers, getCustomerById } from "@/services/data-service";
import { ChevronLeft, Download, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import DateRangeDropdown from "@/components/DateRangeDropdown";

const InvoicingReport = () => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  // Filter invoices based on date range
  const filteredInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.date);
    return invoiceDate >= startDate && invoiceDate <= endDate;
  });

  // Calculate invoice statistics
  const totalInvoiceAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const paidInvoices = filteredInvoices.filter(invoice => invoice.status === 'paid');
  const totalPaid = paidInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const unpaidInvoices = filteredInvoices.filter(invoice => invoice.status === 'unpaid');
  const totalUnpaid = unpaidInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const pendingInvoices = filteredInvoices.filter(invoice => invoice.status === 'pending');
  const totalPending = pendingInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

  // Calculate payment statistics
  const averageInvoiceValue = filteredInvoices.length > 0 
    ? totalInvoiceAmount / filteredInvoices.length 
    : 0;

  // Create pie chart data for invoice status
  const invoiceStatusData = [
    { name: 'Paid', value: paidInvoices.length, amount: totalPaid },
    { name: 'Unpaid', value: unpaidInvoices.length, amount: totalUnpaid },
    { name: 'Pending', value: pendingInvoices.length, amount: totalPending }
  ];

  // Create bar chart data for top customers
  const customerInvoiceTotals = {};
  filteredInvoices.forEach(invoice => {
    const customerId = invoice.customerId;
    if (!customerInvoiceTotals[customerId]) {
      customerInvoiceTotals[customerId] = 0;
    }
    customerInvoiceTotals[customerId] += invoice.total;
  });

  const topCustomersData = Object.keys(customerInvoiceTotals)
    .map(customerId => {
      const customer = getCustomerById(customerId);
      return {
        name: customer ? customer.name : 'Unknown',
        total: customerInvoiceTotals[customerId]
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);  // Get top 5 customers

  const COLORS = ['#4ade80', '#f87171', '#facc15', '#60a5fa', '#8884d8'];

  const handleDateRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
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
          <h1 className="text-3xl font-bold tracking-tight">Invoicing Report</h1>
        </div>
        <div className="mt-4 sm:mt-0">
          <DateRangeDropdown 
            startDate={startDate}
            endDate={endDate}
            onRangeChange={handleDateRangeChange}
          />
        </div>
      </div>
      
      {/* Statistics */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredInvoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalInvoiceAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg. Invoice Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageInvoiceValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Payment Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredInvoices.length > 0 
                ? `${Math.round((paidInvoices.length / filteredInvoices.length) * 100)}%` 
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Invoice Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
            <CardDescription>Distribution of invoices by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={invoiceStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {invoiceStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, entry) => {
                    // @ts-ignore - entry has custom data
                    const amount = entry.payload.amount;
                    return [`${value} invoices ($${amount.toFixed(2)})`, name];
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Top Customers Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
            <CardDescription>Customers with highest invoice totals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCustomersData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value) => [`$${parseFloat(value as string).toFixed(2)}`, 'Total']} />
                  <Bar dataKey="total" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Invoice Details</CardTitle>
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
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => {
                const customer = getCustomerById(invoice.customerId);
                
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>{customer?.name || "Unknown"}</TableCell>
                    <TableCell>${invoice.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                          invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </div>
                    </TableCell>
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
