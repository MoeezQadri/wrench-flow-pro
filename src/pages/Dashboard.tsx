
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { OrganizationDisplay } from '@/components/organization/OrganizationDisplay';
import { useDebounce } from '@/hooks/useDebounce';
import { useDataCache } from '@/hooks/useDataCache';
import { toast } from "sonner";
import PageWrapper from '@/components/PageWrapper';

const Dashboard = () => {
  const { formatCurrency, organizationInfo } = useOrganizationSettings();
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  
  // Debounce date changes to prevent rapid API calls
  const debouncedStartDate = useDebounce(startDate, 300);
  const debouncedEndDate = useDebounce(endDate, 300);
  
  // Use data cache with 5-minute TTL
  const { fetchWithCache } = useDataCache<DashboardData | ChartData[]>('dashboard');
  
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

  // Memoize cache keys based on date range
  const cacheKey = useMemo(() => 
    `${debouncedStartDate.toISOString()}-${debouncedEndDate.toISOString()}`, 
    [debouncedStartDate, debouncedEndDate]
  );

  const loadDashboardData = useCallback(async (force = false) => {
    setIsLoading(true);
    try {
      const metricsData = await fetchWithCache(
        `metrics-${cacheKey}`,
        () => fetchDashboardData(debouncedStartDate, debouncedEndDate),
        force
      ) as DashboardData;
      
      setDashboardData(metricsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedStartDate, debouncedEndDate, cacheKey, fetchWithCache]);

  const loadChartData = useCallback(async (force = false) => {
    setChartLoading(true);
    try {
      const chartDataResult = await fetchWithCache(
        `chart-${cacheKey}`,
        () => fetchChartData(debouncedStartDate, debouncedEndDate),
        force
      ) as ChartData[];
      
      setChartData(chartDataResult);
    } catch (error) {
      console.error('Error loading chart data:', error);
      toast.error('Failed to load chart data');
    } finally {
      setChartLoading(false);
    }
  }, [debouncedStartDate, debouncedEndDate, cacheKey, fetchWithCache]);

  // Load data when debounced dates change
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Load chart data separately with intersection observer for lazy loading
  useEffect(() => {
    const timer = setTimeout(() => {
      loadChartData();
    }, 100); // Small delay to prioritize metrics loading
    
    return () => clearTimeout(timer);
  }, [loadChartData]);

  const handleDateRangeChange = useCallback((newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, []);

  const handleRefresh = useCallback(() => {
    loadDashboardData(true);
    loadChartData(true);
  }, [loadDashboardData, loadChartData]);

  const headerActions = (
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
  );

  return (
    <PageWrapper
      title="Dashboard"
      subtitle="Overview of your garage operations and performance metrics"
      headerActions={headerActions}
      showSkeleton={false}
    >
      <div className="space-y-6">

      {/* Metrics Cards */}
      <DashboardMetrics data={dashboardData} isLoading={isLoading} />

      {/* Charts and Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <RevenueChart data={chartData} isLoading={chartLoading} />
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
    </PageWrapper>
  );
};

export default Dashboard;
