
import React, { useState, useEffect } from 'react';
import { subDays } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import {
  Calendar,
  FileText,
  Users,
  Wrench,
  RefreshCw
} from 'lucide-react';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { fetchDashboardData, fetchChartData, DashboardData, ChartData } from '@/services/dashboard-service';
import { toast } from "sonner";

const Dashboard = () => {
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalRevenue: 0,
    revenueChange: 0,
    totalInvoices: 0,
    invoicesChange: 0,
    activeTasks: 0,
    tasksChange: 0,
    newCustomers: 0,
    customersChange: 0,
    completedJobs: 0,
    jobsChange: 0,
    averageJobValue: 0,
    jobValueChange: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [metricsData, chartDataResult] = await Promise.all([
        fetchDashboardData(startDate, endDate),
        fetchChartData(startDate, endDate)
      ]);
      
      setDashboardData(metricsData);
      setChartData(chartDataResult);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [startDate, endDate]);

  const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your garage operations and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onRangeChange={handleDateRangeChange}
          />
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <DashboardMetrics data={dashboardData} isLoading={isLoading} />

      {/* Charts and Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <RevenueChart data={chartData} isLoading={isLoading} />
        </div>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/invoices/new" className="flex flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center hover:bg-accent hover:text-accent-foreground transition-colors">
                <div className="rounded-full bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-2 font-medium">New Invoice</h3>
              </Link>
              <Link to="/tasks" className="flex flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center hover:bg-accent hover:text-accent-foreground transition-colors">
                <div className="rounded-full bg-primary/10 p-2">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-2 font-medium">Schedule Task</h3>
              </Link>
              <Link to="/customers" className="flex flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center hover:bg-accent hover:text-accent-foreground transition-colors">
                <div className="rounded-full bg-primary/10 p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-2 font-medium">Add Customer</h3>
              </Link>
              <Link to="/mechanics" className="flex flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center hover:bg-accent hover:text-accent-foreground transition-colors">
                <div className="rounded-full bg-primary/10 p-2">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-2 font-medium">Add Mechanic</h3>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from your garage operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Activity feed coming soon...
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
