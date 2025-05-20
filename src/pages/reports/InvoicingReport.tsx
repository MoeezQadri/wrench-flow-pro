
import React, { useState, useEffect } from "react";
import { format, isWithinInterval, parseISO, subDays } from "date-fns";
import { Link } from "react-router-dom";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";
import { Invoice, InvoiceStatus } from "@/types";
import { getInvoices, calculateInvoiceTotal } from "@/services/data-service";
import DateRangeDropdown from "@/components/DateRangeDropdown";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, ArrowLeft, FileText, Search } from "lucide-react";

const COLORS = ['#FFC107', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444'];

const InvoicingReport = () => {
  const today = new Date();
  const thirtyDaysAgo = subDays(today, 30);
  
  const [startDate, setStartDate] = useState<Date>(thirtyDaysAgo);
  const [endDate, setEndDate] = useState<Date>(today);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Invoice | 'total' | 'customerName';
    direction: 'ascending' | 'descending';
  }>({ key: 'date', direction: 'descending' });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load invoice data
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setIsLoading(true);
        const invoicesData = await getInvoices();
        setInvoices(invoicesData);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoiceData();
  }, []);

  // Filter invoices by date range
  const filteredInvoices = invoices.filter(invoice => {
    try {
      const invoiceDate = parseISO(invoice.date);
      return isWithinInterval(invoiceDate, { start: startDate, end: endDate });
    } catch (e) {
      // Handle parsing errors (invalid dates)
      return false;
    }
  });

  // Calculate statistics
  const totalInvoiceValue = filteredInvoices.reduce((sum, invoice) => {
    const { total } = calculateInvoiceTotal(invoice);
    return sum + total;
  }, 0);

  const invoicesByStatus = {
    open: filteredInvoices.filter(invoice => invoice.status === 'open').length,
    inProgress: filteredInvoices.filter(invoice => invoice.status === 'in-progress').length,
    completed: filteredInvoices.filter(invoice => invoice.status === 'completed').length,
    paid: filteredInvoices.filter(invoice => invoice.status === 'paid').length,
    partial: filteredInvoices.filter(invoice => invoice.status === 'partial').length,
  };

  const chartData = [
    { name: 'Open', value: invoicesByStatus.open },
    { name: 'In Progress', value: invoicesByStatus.inProgress },
    { name: 'Completed', value: invoicesByStatus.completed },
    { name: 'Paid', value: invoicesByStatus.paid },
    { name: 'Partial', value: invoicesByStatus.partial }
  ].filter(item => item.value > 0);

  // Apply search filter
  const searchedInvoices = filteredInvoices.filter(invoice => {
    const invoiceId = invoice.id.toLowerCase();
    const vehicleMake = (invoice.vehicleInfo?.make || "").toLowerCase();
    const vehicleModel = (invoice.vehicleInfo?.model || "").toLowerCase();
    const licensePlate = (invoice.vehicleInfo?.licensePlate || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return invoiceId.includes(search) || 
           vehicleMake.includes(search) || 
           vehicleModel.includes(search) || 
           licensePlate.includes(search);
  });

  // Apply sorting
  const sortedInvoices = [...searchedInvoices].sort((a, b) => {
    if (sortConfig.key === 'total') {
      const totalA = calculateInvoiceTotal(a).total;
      const totalB = calculateInvoiceTotal(b).total;
      
      if (sortConfig.direction === 'ascending') {
        return totalA - totalB;
      } else {
        return totalB - totalA;
      }
    }
    
    if (sortConfig.key === 'date') {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      if (sortConfig.direction === 'ascending') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    }
    
    if (sortConfig.key === 'status') {
      const statusA = a.status;
      const statusB = b.status;
      
      if (sortConfig.direction === 'ascending') {
        return statusA.localeCompare(statusB);
      } else {
        return statusB.localeCompare(statusA);
      }
    }
    
    return 0;
  });

  const handleSort = (key: typeof sortConfig.key) => {
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending'
      });
    } else {
      setSortConfig({ key, direction: 'ascending' });
    }
  };

  const handleDateRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading invoice data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link to="/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Invoicing Summary</h1>
        </div>
        <DateRangeDropdown 
          startDate={startDate}
          endDate={endDate}
          onRangeChange={handleDateRangeChange}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredInvoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalInvoiceValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Invoice Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${filteredInvoices.length > 0 
                ? (totalInvoiceValue / filteredInvoices.length).toFixed(2) 
                : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Distribution</CardTitle>
            <CardDescription>Breakdown of invoices by current status</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No invoice data available for the selected period
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} invoices`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
            <CardDescription>Count of invoices by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-yellow-400 mr-2"></div>
                <span className="flex-1">Open</span>
                <span className="font-medium">{invoicesByStatus.open}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                <span className="flex-1">In Progress</span>
                <span className="font-medium">{invoicesByStatus.inProgress}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <span className="flex-1">Completed</span>
                <span className="font-medium">{invoicesByStatus.completed}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-purple-500 mr-2"></div>
                <span className="flex-1">Paid</span>
                <span className="font-medium">{invoicesByStatus.paid}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-orange-500 mr-2"></div>
                <span className="flex-1">Partial Payment</span>
                <span className="font-medium">{invoicesByStatus.partial}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          <CardDescription>All invoices in the selected period</CardDescription>
          <div className="mt-4 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search invoices..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" className="p-0 h-8 hover:bg-transparent" onClick={() => handleSort('id')}>
                    Invoice ID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" className="p-0 h-8 hover:bg-transparent" onClick={() => handleSort('date')}>
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>
                  <Button variant="ghost" className="p-0 h-8 hover:bg-transparent" onClick={() => handleSort('status')}>
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" className="p-0 h-8 hover:bg-transparent" onClick={() => handleSort('total')}>
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No invoices found for the selected period
                  </TableCell>
                </TableRow>
              ) : (
                sortedInvoices.map((invoice) => {
                  const { total } = calculateInvoiceTotal(invoice);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{format(new Date(invoice.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {`${invoice.vehicleInfo?.make || 'N/A'} ${invoice.vehicleInfo?.model || ''} ${invoice.vehicleInfo?.licensePlate ? `(${invoice.vehicleInfo.licensePlate})` : ''}`}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell className="text-right">${total.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicingReport;
