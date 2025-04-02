
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { calculateInvoiceTotal, invoices, tasks } from "@/services/data-service";
import { InvoiceStatus } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { format, subDays } from "date-fns";

// Define colors for different invoice statuses
const statusColors = {
  open: "#facc15", // yellow
  "in-progress": "#3b82f6", // blue
  completed: "#22c55e", // green
  paid: "#a855f7", // purple
  partial: "#f97316", // orange
};

const InvoicingReport = () => {
  const [startDate, setStartDate] = useState<string>(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );

  // Calculate task metrics
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  
  // Calculate efficiency
  let totalEstimatedHours = 0;
  let totalSpentHours = 0;
  
  completedTasks.forEach(task => {
    totalEstimatedHours += task.hoursEstimated;
    totalSpentHours += task.hoursSpent || task.hoursEstimated;
  });
  
  const mechanicEfficiency = completedTasks.length > 0
    ? Math.round((totalEstimatedHours / totalSpentHours) * 100)
    : 100;

  // Filter invoices by date range
  const filteredInvoices = invoices.filter(
    (invoice) => invoice.date >= startDate && invoice.date <= endDate
  );

  // Prepare data for the status chart
  const statusCounts: Record<InvoiceStatus, number> = {
    open: 0,
    "in-progress": 0,
    completed: 0,
    paid: 0,
    partial: 0,
  };

  filteredInvoices.forEach((invoice) => {
    statusCounts[invoice.status]++;
  });

  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link to="/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Invoicing Summary</h1>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <label htmlFor="start-date" className="text-sm font-medium">
              From:
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="end-date" className="text-sm font-medium">
              To:
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Task metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tasks Completed</CardTitle>
            <CardDescription>Completion rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks.length} / {totalTasks}</div>
            <p className="text-muted-foreground">{completionRate}% completion rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Mechanic Efficiency</CardTitle>
            <CardDescription>Estimated vs actual hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mechanicEfficiency}%</div>
            <p className="text-muted-foreground">
              {totalEstimatedHours} est. / {totalSpentHours.toFixed(1)} actual hours
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Invoices</CardTitle>
            <CardDescription>For selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredInvoices.length}</div>
            <p className="text-muted-foreground">
              {format(new Date(startDate), "MMM d, yyyy")} - {format(new Date(endDate), "MMM d, yyyy")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice status chart */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Status Distribution</CardTitle>
          <CardDescription>
            Summary of invoice statuses in the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ChartContainer 
              config={{ 
                status: { 
                  theme: { 
                    light: "#64748b", 
                    dark: "#94a3b8" 
                  } 
                } 
              }}
            >
              <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" name="Invoices">
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={statusColors[entry.status as InvoiceStatus] || "#64748b"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Invoices table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>
            List of all invoices in the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => {
                  const { total } = calculateInvoiceTotal(invoice);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.id.replace("invoice-", "#")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {invoice.vehicleInfo.make} {invoice.vehicleInfo.model}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        ${total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No invoices found for the selected date range
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

export default InvoicingReport;
