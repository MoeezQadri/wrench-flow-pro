
import React, { memo, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";

interface ChartData {
  date: string;
  revenue: number;
  expenses: number;
  invoices: number;
}

interface RevenueChartProps {
  data: ChartData[];
  isLoading: boolean;
}

const RevenueChart = memo(function RevenueChart({ data, isLoading }: RevenueChartProps) {
  const { formatCurrency } = useOrganizationSettings();
  
  // Memoize chart configuration to prevent unnecessary re-renders
  const chartConfig = useMemo(() => ({
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
    animationDuration: 300,
  }), []);
  
  // Memoize tooltip formatter to prevent recreation on each render
  const tooltipFormatter = useMemo(() => 
    (value: any, name: string) => [
      formatCurrency(Number(value)), 
      name === 'revenue' ? 'Revenue' : 'Expenses'
    ], [formatCurrency]
  );
  
  const labelFormatter = useMemo(() => 
    (label: string) => {
      const date = new Date(label);
      return date.toLocaleDateString(undefined, { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }, []
  );
  
  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Daily revenue and expenses over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full bg-muted animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
        <CardDescription>Daily revenue and expenses over the selected period</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              margin={chartConfig.margin}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={tooltipFormatter}
                labelFormatter={labelFormatter}
              />
              <Bar 
                dataKey="revenue" 
                name="revenue" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="expenses" 
                name="expenses" 
                fill="#ef4444" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

export { RevenueChart };
