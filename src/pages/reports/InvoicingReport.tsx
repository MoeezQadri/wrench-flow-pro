
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, Download, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { subDays } from "date-fns";
import { useDataContext } from "@/context/data/DataContext";
import { isWithinInterval, parseISO } from "date-fns";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { calculateInvoiceBreakdown } from '@/utils/invoice-calculations';

const InvoicingReport = () => {
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const { invoices, customers, payments } = useDataContext();
  const { formatCurrency } = useOrganizationSettings();

  // Filter invoices for the selected date range
  const filteredInvoices = invoices.filter(invoice => {
    try {
      const invoiceDate = parseISO(invoice.date || '');
      return isWithinInterval(invoiceDate, { start: startDate, end: endDate });
    } catch (e) {
      return false;
    }
  });

  // Calculate statistics
  const totalInvoices = filteredInvoices.length;
  const paidInvoices = filteredInvoices.filter(inv => inv.status === 'paid').length;
  const openInvoices = filteredInvoices.filter(inv => inv.status === 'open').length;
  const overdueInvoices = filteredInvoices.filter(inv => inv.status === 'overdue').length;

  const totalRevenue = filteredInvoices.reduce((sum, invoice) => {
    // Calculate invoice total from invoice items
    const invoiceTotal = invoice.items?.reduce((itemSum: number, item: any) => 
      itemSum + (item.quantity * item.price), 0) || 0;
    return sum + invoiceTotal;
  }, 0);

  const paidAmount = payments
    .filter(payment => {
      const invoice = filteredInvoices.find(inv => inv.id === payment.invoice_id);
      return invoice && invoice.status === 'paid';
    })
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const outstandingAmount = totalRevenue - paidAmount;

  const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
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
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onRangeChange={handleDateRangeChange}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{openInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words">{formatCurrency(outstandingAmount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold break-words">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Amount Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 break-words">{formatCurrency(paidAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalRevenue > 0 ? ((paidAmount / totalRevenue) * 100).toFixed(1) : 0}%
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
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No invoices found for the selected date range
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => {
                  const customer = customers.find(c => c.id === invoice.customer_id);
                  const invoiceTotal = invoice.items?.reduce((sum: number, item: any) => 
                    sum + (item.quantity * item.price), 0) || 0;

                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">#{invoice.id?.slice(0, 8)}</TableCell>
                      <TableCell>{customer?.name || "Unknown"}</TableCell>
                      <TableCell>{new Date(invoice.date || '').toLocaleDateString()}</TableCell>
                      <TableCell>{formatCurrency(invoiceTotal)}</TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invoice.status}
                        </div>
                      </TableCell>
                      <TableCell>
                        {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
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
