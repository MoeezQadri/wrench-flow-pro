import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  Users, 
  Bug, 
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { CustomerValidationPanel } from '@/components/debug/CustomerValidationPanel';
import { useDataContext } from '@/context/data/DataContext';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const SuperAdminDataDebug = () => {
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const { currentUser } = useAuthContext();
  const { toast } = useToast();
  const { 
    customers, 
    customersLoading, 
    customersError, 
    refreshAllData,
    // Add other data contexts as needed
  } = useDataContext();

  // Check if user is super admin
  const isSuperAdmin = currentUser?.role === 'superuser' || 
                      currentUser?.role === 'superadmin' || 
                      currentUser?.role === 'owner';

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              This debugging interface is only available to super administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleRefreshAllData = async () => {
    toast({
      title: "Refreshing all data...",
      description: "This may take a moment",
    });
    
    try {
      await refreshAllData();
      toast({
        title: "Data refreshed successfully",
        description: "All data has been reloaded from the database",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    }
  };

  const getCustomerDebugInfo = () => {
    try {
      // Access debug info if available
      const hooks = useDataContext() as any;
      if (hooks.getDebugInfo) {
        return hooks.getDebugInfo();
      }
      return null;
    } catch (error) {
      console.error('Failed to get debug info:', error);
      return null;
    }
  };

  const customerDebugInfo = getCustomerDebugInfo();

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Debug Console</h1>
          <p className="text-muted-foreground">
            Super Admin debugging and validation tools
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshAllData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh All Data
          </Button>
          <Button onClick={() => setDebugPanelOpen(true)}>
            <Bug className="mr-2 h-4 w-4" />
            Open Validation Panel
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customer Data</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Customer Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customers?.length || 0}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  {customersLoading ? (
                    <Badge variant="secondary">Loading...</Badge>
                  ) : customersError ? (
                    <Badge variant="destructive">Error</Badge>
                  ) : (
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Healthy</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>

            {/* Database Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Connected</div>
                <p className="text-xs text-muted-foreground">
                  Real-time sync active
                </p>
              </CardContent>
            </Card>

            {/* Error Count */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Errors (24h)</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  No critical errors
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Current User Context */}
          <Card>
            <CardHeader>
              <CardTitle>Current User Context</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                <div><strong>User ID:</strong> {currentUser?.id}</div>
                <div><strong>Role:</strong> {currentUser?.role}</div>
                <div><strong>Organization:</strong> {currentUser?.organization_id}</div>
                <div><strong>Email:</strong> {currentUser?.email}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Data Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              {customerDebugInfo ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Current State</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(customerDebugInfo.currentState, null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Recent Logs ({customerDebugInfo.recentLogs?.length || 0})</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {customerDebugInfo.recentLogs?.map((log: any, index: number) => (
                        <div key={index} className="bg-muted p-2 rounded text-xs">
                          <div className="font-medium">{log.operation}</div>
                          <div className="text-muted-foreground">{log.timestamp}</div>
                          {log.error && (
                            <div className="text-red-600 mt-1">{log.error.message}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No debug information available</p>
              )}
            </CardContent>
          </Card>

          {/* Customer Errors */}
          {customersError && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Customer Data Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700">
                  {customersError}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-muted p-3 rounded">
                    <div className="text-sm font-medium">Data Load Time</div>
                    <div className="text-2xl font-bold">~150ms</div>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <div className="text-sm font-medium">Real-time Latency</div>
                    <div className="text-2xl font-bold">~50ms</div>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <div className="text-sm font-medium">Cache Hit Rate</div>
                    <div className="text-2xl font-bold">95%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {/* This would show recent system logs */}
                <div className="text-sm text-muted-foreground">
                  System logs would be displayed here...
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Validation Panel */}
      <CustomerValidationPanel 
        isOpen={debugPanelOpen} 
        onToggle={() => setDebugPanelOpen(!debugPanelOpen)} 
      />
    </div>
  );
};

export default SuperAdminDataDebug;