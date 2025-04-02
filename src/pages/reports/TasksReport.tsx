
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { tasks, mechanics, getMechanicById, getCurrentUser } from "@/services/data-service";
import { ChevronLeft, Download, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import DateRangeDropdown from "@/components/DateRangeDropdown";

const TasksReport = () => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const currentUser = getCurrentUser();
  const isForeman = currentUser.role === 'foreman';
  
  // Filter tasks based on date range
  const filteredTasks = tasks.filter(task => {
    const taskDate = new Date(task.date || "2023-05-15"); // Default date as fallback
    return taskDate >= startDate && taskDate <= endDate;
  });

  // Mechanic efficiency chart data
  const mechanicEfficiencyData = mechanics.map(mechanic => {
    const mechanicTasks = filteredTasks.filter(task => task.mechanicId === mechanic.id && task.status === 'completed');
    const totalEstimated = mechanicTasks.reduce((sum, task) => sum + task.hoursEstimated, 0);
    const totalActual = mechanicTasks.reduce((sum, task) => sum + (task.hoursSpent || 0), 0);
    const efficiency = totalEstimated > 0 ? Math.round((totalEstimated / (totalActual || 1)) * 100) : 100;
    
    return {
      name: mechanic.name,
      efficiency: efficiency,
      estimatedHours: totalEstimated,
      actualHours: totalActual
    };
  });

  // Mechanic utilization data (tasks assigned per mechanic)
  const mechanicUtilizationData = mechanics.map(mechanic => {
    const pendingTasks = filteredTasks.filter(task => 
      task.mechanicId === mechanic.id && task.status === 'pending'
    ).length;
    
    const inProgressTasks = filteredTasks.filter(task => 
      task.mechanicId === mechanic.id && task.status === 'in-progress'
    ).length;
    
    const completedTasks = filteredTasks.filter(task => 
      task.mechanicId === mechanic.id && task.status === 'completed'
    ).length;
    
    const totalTasks = pendingTasks + inProgressTasks + completedTasks;
    
    return {
      name: mechanic.name,
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      value: totalTasks // for pie chart
    };
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#83a6ed'];

  const handleDateRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Task status summary
  const pendingTasks = filteredTasks.filter(task => task.status === 'pending').length;
  const inProgressTasks = filteredTasks.filter(task => task.status === 'in-progress').length;
  const completedTasks = filteredTasks.filter(task => task.status === 'completed').length;
  const totalTasks = filteredTasks.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/reports">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Reports
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Tasks Report</h1>
        </div>
        <div className="mt-4 sm:mt-0">
          <DateRangeDropdown 
            startDate={startDate}
            endDate={endDate}
            onRangeChange={handleDateRangeChange}
          />
        </div>
      </div>
      
      {/* Statistics */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground">{((pendingTasks / totalTasks) * 100).toFixed(1)}% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">{((inProgressTasks / totalTasks) * 100).toFixed(1)}% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <p className="text-xs text-muted-foreground">{((completedTasks / totalTasks) * 100).toFixed(1)}% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">All tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Mechanic Efficiency Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Mechanic Efficiency</CardTitle>
          <CardDescription>Estimated vs. actual hours spent on tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mechanicEfficiencyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="estimatedHours" name="Estimated Hours" fill="#4ade80" />
                <Bar dataKey="actualHours" name="Actual Hours" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Mechanic Workload Distribution - Especially useful for foremen */}
      {(isForeman || currentUser.role === 'manager' || currentUser.role === 'owner') && (
        <Card>
          <CardHeader>
            <CardTitle>Mechanic Workload Distribution</CardTitle>
            <CardDescription>Tasks assigned to each mechanic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex flex-col md:flex-row items-center justify-center">
              <div className="w-full md:w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mechanicUtilizationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {mechanicUtilizationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} tasks`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 overflow-y-auto h-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mechanic</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>In Progress</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mechanicUtilizationData.map((mechanic) => (
                      <TableRow key={mechanic.name}>
                        <TableCell className="font-medium">{mechanic.name}</TableCell>
                        <TableCell>{mechanic.totalTasks}</TableCell>
                        <TableCell>{mechanic.pendingTasks}</TableCell>
                        <TableCell>{mechanic.inProgressTasks}</TableCell>
                        <TableCell>{mechanic.completedTasks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tasks</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Mechanic</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Est. Hours</TableHead>
                <TableHead>Actual Hours</TableHead>
                <TableHead>Efficiency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => {
                const mechanic = getMechanicById(task.mechanicId);
                const efficiency = task.hoursEstimated && task.hoursSpent
                  ? Math.round((task.hoursEstimated / task.hoursSpent) * 100)
                  : null;
                  
                return (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>{mechanic?.name || "Unknown"}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </div>
                    </TableCell>
                    <TableCell>{task.hoursEstimated}</TableCell>
                    <TableCell>{task.hoursSpent || "In Progress"}</TableCell>
                    <TableCell>
                      {efficiency ? (
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${efficiency >= 100 ? 'bg-green-100 text-green-800' : 
                            efficiency >= 70 ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {efficiency}%
                        </div>
                      ) : "N/A"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TasksReport;
