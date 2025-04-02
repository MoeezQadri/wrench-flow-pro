
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LineChart, BarChart2, PieChart, Activity, Users, MousePointer, Clock } from 'lucide-react';
import { LineChart as LineChartComponent, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
         BarChart, Bar, PieChart as PieChartComponent, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

// Sample data - in a real app, this would come from Google Analytics API
const pageViewData = [
  { name: 'Mon', views: 1200 },
  { name: 'Tue', views: 1900 },
  { name: 'Wed', views: 1700 },
  { name: 'Thu', views: 2100 },
  { name: 'Fri', views: 2500 },
  { name: 'Sat', views: 1800 },
  { name: 'Sun', views: 1400 },
];

const userSourceData = [
  { name: 'Direct', value: 40 },
  { name: 'Organic Search', value: 30 },
  { name: 'Referral', value: 20 },
  { name: 'Social Media', value: 10 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AdminAnalyticsIntegration = () => {
  const [gaTrackingId, setGaTrackingId] = useState('UA-XXXXXXXXX-X');
  const [isAnalyticsEnabled, setIsAnalyticsEnabled] = useState(true);
  const [isEventTrackingEnabled, setIsEventTrackingEnabled] = useState(true);
  const [isUserTrackingEnabled, setIsUserTrackingEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const handleSaveGASettings = () => {
    toast.success('Google Analytics settings updated successfully');
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Google Analytics Configuration</CardTitle>
          <CardDescription>Configure your Google Analytics tracking for better insights</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ga-tracking-id">Google Analytics Tracking ID</Label>
            <div className="flex gap-2">
              <Input 
                id="ga-tracking-id" 
                value={gaTrackingId} 
                onChange={(e) => setGaTrackingId(e.target.value)} 
                placeholder="UA-XXXXXXXXX-X or G-XXXXXXXXXX"
              />
              <Button onClick={handleSaveGASettings}>Save</Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 pt-4">
            <Switch 
              id="analytics-enabled" 
              checked={isAnalyticsEnabled}
              onCheckedChange={setIsAnalyticsEnabled}
            />
            <Label htmlFor="analytics-enabled">Enable Analytics Tracking</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="event-tracking-enabled" 
              checked={isEventTrackingEnabled}
              onCheckedChange={setIsEventTrackingEnabled}
              disabled={!isAnalyticsEnabled}
            />
            <Label htmlFor="event-tracking-enabled">Track User Events</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="user-tracking-enabled" 
              checked={isUserTrackingEnabled}
              onCheckedChange={setIsUserTrackingEnabled}
              disabled={!isAnalyticsEnabled}
            />
            <Label htmlFor="user-tracking-enabled">Track User Demographics</Label>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 flex flex-col items-start px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Remember to add the tracking code to your website and configure your cookie settings to comply with privacy regulations like GDPR.
          </p>
        </CardFooter>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="traffic">
            <LineChart className="h-4 w-4 mr-2" />
            Traffic
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="behavior">
            <MousePointer className="h-4 w-4 mr-2" />
            Behavior
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                <CardDescription className="text-2xl font-bold">12,543</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs text-muted-foreground">
                  <span className="text-emerald-500 font-medium">↑ 23%</span> vs. last period
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Session Duration</CardTitle>
                <CardDescription className="text-2xl font-bold">2m 45s</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs text-muted-foreground">
                  <span className="text-emerald-500 font-medium">↑ 12%</span> vs. last period
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                <CardDescription className="text-2xl font-bold">42.3%</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs text-muted-foreground">
                  <span className="text-red-500 font-medium">↑ 3%</span> vs. last period
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Page Views Over Time</CardTitle>
                <CardDescription>Daily page views for the last week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChartComponent data={pageViewData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="views" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChartComponent>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Where your visitors are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChartComponent>
                      <Pie
                        data={userSourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {userSourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChartComponent>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="traffic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Analysis</CardTitle>
              <CardDescription>Detailed breakdown of your website traffic</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Connect your Google Analytics account to view detailed traffic data, including sources, medium, referrals, and campaign performance.
              </p>
              
              <div className="h-[400px] flex justify-center items-center">
                <div className="text-center">
                  <LineChart className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Connect Google Analytics</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    To view traffic analysis, connect your Google Analytics account.
                  </p>
                  <Button className="mt-4">Connect Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Analysis</CardTitle>
              <CardDescription>Detailed breakdown of your user demographics and behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Connect your Google Analytics account to view detailed user data, including demographics, interests, engagement, and retention metrics.
              </p>
              
              <div className="h-[400px] flex justify-center items-center">
                <div className="text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Connect Google Analytics</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    To view user analysis, connect your Google Analytics account.
                  </p>
                  <Button className="mt-4">Connect Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="behavior" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Behavior</CardTitle>
              <CardDescription>How users are interacting with your website</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Connect your Google Analytics account to view detailed behavior data, including popular content, navigation paths, and conversion funnels.
              </p>
              
              <div className="h-[400px] flex justify-center items-center">
                <div className="text-center">
                  <MousePointer className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Connect Google Analytics</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    To view behavior analysis, connect your Google Analytics account.
                  </p>
                  <Button className="mt-4">Connect Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalyticsIntegration;
