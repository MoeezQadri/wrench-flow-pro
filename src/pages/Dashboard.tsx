import { 
  BarChart, 
  Calendar, 
  DollarSign, 
  FileText, 
  Wrench,
  TrendingUp, 
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart as RechartsBarChart,
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { calculateDashboardMetrics } from '@/services/data-service';
import { useState, useEffect } from 'react';
import { DashboardMetrics } from '@/types';
import { resolvePromiseAndSetState } from '@/utils/async-helpers';
import { useAsyncData } from '@/hooks/useAsyncData';

// Sample data for charts with expenses added
const weeklyRevenueData = [
  { name: 'Mon', revenue: 500, expenses: 300 },
  { name: 'Tue', revenue: 750, expenses: 450 },
  { name: 'Wed', revenue: 620, expenses: 380 },
  { name: 'Thu', revenue: 880, expenses: 520 },
  { name: 'Fri', revenue: 950, expenses: 600 },
  { name: 'Sat', revenue: 670, expenses: 380 },
  { name: 'Sun', revenue: 350, expenses: 200 },
];

const Dashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    pendingInvoices: 0,
    activeJobs: 0,
    mechanicEfficiency: 0,
    completedJobs: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    monthlyProfit: 0,
    activeCustomers: 0, // Using activeCustomers instead of customerCount
    vehicleCount: 0,
    averageJobValue: 0,
    inventoryValue: 0,
    pendingTasks: 0,
    activeVehicles: 0,
    lowStockItems: 0
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      await resolvePromiseAndSetState(calculateDashboardMetrics(), setMetrics);
      setLoading(false);
    };
    
    loadMetrics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <span className="text-sm text-muted-foreground">Last updated: Today, 2:30 PM</span>
        </div>
      </div>
      
      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+2.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">-1 from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeJobs}</div>
            <p className="text-xs text-muted-foreground">+1 from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mechanic Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.mechanicEfficiency}%</div>
            <p className="text-xs text-muted-foreground">+5% from last week</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Weekly Revenue & Expenses</CardTitle>
            <CardDescription>Overview of this week's financial activity</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={weeklyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
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
    </div>
  );
};

export default Dashboard;
