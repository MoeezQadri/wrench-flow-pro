
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Users, CreditCard, TrendingUp, Package } from 'lucide-react';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';

// Mock data for subscription metrics
const subscriptionData = [
  { month: 'Jan', users: 12, revenue: 1100 },
  { month: 'Feb', users: 19, revenue: 1400 },
  { month: 'Mar', users: 25, revenue: 2000 },
  { month: 'Apr', users: 32, revenue: 2400 },
  { month: 'May', users: 35, revenue: 2600 },
  { month: 'Jun', users: 41, revenue: 3100 },
  { month: 'Jul', users: 45, revenue: 3400 },
  { month: 'Aug', users: 52, revenue: 4000 },
  { month: 'Sep', users: 56, revenue: 4200 },
  { month: 'Oct', users: 60, revenue: 4500 },
  { month: 'Nov', users: 63, revenue: 4800 },
  { month: 'Dec', users: 67, revenue: 5100 }
];

// Mock data for plan distribution
const planDistribution = [
  { name: 'Basic', value: 30, color: '#4ade80' },
  { name: 'Professional', value: 45, color: '#3b82f6' },
  { name: 'Enterprise', value: 25, color: '#8b5cf6' }
];

// Mock data for user growth
const userGrowthData = [
  { month: 'Jul', users: 46 },
  { month: 'Aug', users: 52 },
  { month: 'Sep', users: 56 },
  { month: 'Oct', users: 60 },
  { month: 'Nov', users: 63 },
  { month: 'Dec', users: 67 }
];

// Calculate metrics
const currentMonthRevenue = subscriptionData[subscriptionData.length - 1].revenue;
const previousMonthRevenue = subscriptionData[subscriptionData.length - 2].revenue;
const revenueGrowth = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

const currentMonthUsers = subscriptionData[subscriptionData.length - 1].users;
const previousMonthUsers = subscriptionData[subscriptionData.length - 2].users;
const userGrowth = ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100;

const averageRevenuePerUser = currentMonthRevenue / currentMonthUsers;

const SubscriptionAnalytics = () => {
  const { formatCurrency } = useOrganizationSettings();
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Subscribers Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Subscribers
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentMonthUsers}</div>
          <p className="text-xs text-muted-foreground">
            <span className={userGrowth >= 0 ? "text-green-500" : "text-red-500"}>
              {userGrowth >= 0 ? "+" : ""}{userGrowth.toFixed(1)}%
            </span>{" "}
            from last month
          </p>
        </CardContent>
      </Card>

      {/* Monthly Revenue Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Monthly Revenue
          </CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(currentMonthRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            <span className={revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}>
              {revenueGrowth >= 0 ? "+" : ""}{revenueGrowth.toFixed(1)}%
            </span>{" "}
            from last month
          </p>
        </CardContent>
      </Card>

      {/* Average Revenue Per User Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Avg. Revenue Per User
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(averageRevenuePerUser)}</div>
          <p className="text-xs text-muted-foreground">
            Per subscriber per month
          </p>
        </CardContent>
      </Card>

      {/* Most Popular Plan Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Most Popular Plan
          </CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Professional</div>
          <p className="text-xs text-muted-foreground">
            45% of subscribers
          </p>
        </CardContent>
      </Card>

      {/* Revenue Over Time Chart */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Revenue Growth</CardTitle>
          <CardDescription>
            Monthly subscription revenue over the past year
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={subscriptionData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Subscriber Growth Chart */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Subscriber Growth</CardTitle>
          <CardDescription>
            Recent subscriber growth trends
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={userGrowthData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#4ade80" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Plan Distribution Chart */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Plan Distribution</CardTitle>
          <CardDescription>
            Breakdown of subscription plans
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={planDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {planDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center mt-4 space-x-6">
            {planDistribution.map((entry, index) => (
              <div key={index} className="flex items-center">
                <div
                  className="w-3 h-3 mr-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm">{entry.name}: {entry.value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionAnalytics;
