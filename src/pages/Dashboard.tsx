
import { Card } from '@/components/ui/card';
import { getDashboardMetrics, invoices } from '@/services/data-service';
import { DollarSign, FileText, CheckCircle, Clock, BarChart } from 'lucide-react';

const Dashboard = () => {
  const metrics = getDashboardMetrics();
  
  // Recent invoices (limit to 5)
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Workshop overview and key metrics</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="metric-card">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold">${metrics.totalRevenue.toFixed(2)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">From paid invoices</p>
        </Card>
        
        {/* Pending Invoices */}
        <Card className="metric-card">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Pending Invoices</h3>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold">{metrics.pendingInvoices}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Awaiting completion</p>
        </Card>
        
        {/* Completed Jobs */}
        <Card className="metric-card">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Completed Jobs</h3>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold">{metrics.completedJobs}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Total completed jobs</p>
        </Card>
        
        {/* Mechanic Efficiency */}
        <Card className="metric-card">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Mechanic Efficiency</h3>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold">{metrics.mechanicEfficiency}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Estimated vs actual hours</p>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Invoices Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Invoices</h2>
            <BarChart className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-2 font-medium text-sm">Invoice</th>
                  <th className="text-left pb-2 font-medium text-sm">Customer</th>
                  <th className="text-left pb-2 font-medium text-sm">Date</th>
                  <th className="text-left pb-2 font-medium text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b last:border-0">
                    <td className="py-3 text-sm">#{invoice.id}</td>
                    <td className="py-3 text-sm">
                      {invoice.vehicleInfo.make} {invoice.vehicleInfo.model}
                    </td>
                    <td className="py-3 text-sm">{invoice.date}</td>
                    <td className="py-3 text-sm">
                      <span className={`status-badge status-${invoice.status}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        
        {/* Activity Panel */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Workshop Activity</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-status-in-progress/20 flex items-center justify-center shrink-0">
                <Wrench className="h-5 w-5 text-status-in-progress" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Oil Change Completed</h3>
                <p className="text-xs text-muted-foreground">Dave completed oil change on Toyota Camry</p>
                <p className="text-xs text-muted-foreground mt-1">10:45 AM</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-status-open/20 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-status-open" />
              </div>
              <div>
                <h3 className="text-sm font-medium">New Invoice Created</h3>
                <p className="text-xs text-muted-foreground">Invoice #2 created for Sarah Johnson</p>
                <p className="text-xs text-muted-foreground mt-1">9:32 AM</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-status-paid/20 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-status-paid" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Payment Received</h3>
                <p className="text-xs text-muted-foreground">John Smith paid $179.78 for Invoice #4</p>
                <p className="text-xs text-muted-foreground mt-1">Yesterday</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-status-completed/20 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-status-completed" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Job Completed</h3>
                <p className="text-xs text-muted-foreground">Engine diagnosis completed on Ford F-150</p>
                <p className="text-xs text-muted-foreground mt-1">Yesterday</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
