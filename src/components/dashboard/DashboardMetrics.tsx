
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, Wrench, Users, Calendar, TrendingUp } from "lucide-react";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";

interface MetricsData {
  totalRevenue: number;
  revenueChange: number;
  totalInvoices: number;
  invoicesChange: number;
  activeTasks: number;
  tasksChange: number;
  newCustomers: number;
  customersChange: number;
  completedJobs: number;
  jobsChange: number;
  averageJobValue: number;
  jobValueChange: number;
}

interface DashboardMetricsProps {
  data: MetricsData;
  isLoading: boolean;
}

export function DashboardMetrics({ data, isLoading }: DashboardMetricsProps) {
  const { formatCurrency } = useOrganizationSettings();
  
  const metrics = [
    {
      title: "Total Revenue",
      value: formatCurrency(data.totalRevenue),
      change: data.revenueChange,
      icon: DollarSign,
      description: "Revenue for selected period"
    },
    {
      title: "Total Invoices",
      value: data.totalInvoices.toString(),
      change: data.invoicesChange,
      icon: FileText,
      description: "Invoices created"
    },
    {
      title: "Active Tasks",
      value: data.activeTasks.toString(),
      change: data.tasksChange,
      icon: Wrench,
      description: "Tasks in progress"
    },
    {
      title: "New Customers",
      value: data.newCustomers.toString(),
      change: data.customersChange,
      icon: Users,
      description: "New customers added"
    },
    {
      title: "Completed Jobs",
      value: data.completedJobs.toString(),
      change: data.jobsChange,
      icon: Calendar,
      description: "Jobs finished"
    },
    {
      title: "Avg Job Value",
      value: formatCurrency(data.averageJobValue),
      change: data.jobValueChange,
      icon: TrendingUp,
      description: "Average revenue per job"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded w-16 mb-1"></div>
              <div className="h-3 bg-muted animate-pulse rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const isPositive = metric.change >= 0;
        
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold break-words">{metric.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className={isPositive ? "text-green-600" : "text-red-600"}>
                  {isPositive ? "+" : ""}{metric.change}%
                </span>
                vs previous period
              </p>
              <CardDescription className="mt-1">{metric.description}</CardDescription>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
