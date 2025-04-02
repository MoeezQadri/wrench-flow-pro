
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { tasks, mechanics, getMechanicById } from "@/services/data-service";
import { Calendar, ChevronLeft, ChevronRight, Download, Filter } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

const TasksReport = () => {
  const [selectedDate, setSelectedDate] = useState("2023-05-15");
  
  // We would typically filter by date from API but using our mock data
  // Mechanic efficiency chart data
  const mechanicEfficiencyData = mechanics.map(mechanic => {
    const mechanicTasks = tasks.filter(task => task.mechanicId === mechanic.id && task.status === 'completed');
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

  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  // Task status summary
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold tracking-tight">Tasks Report</h1>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline" size="icon" onClick={handlePreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center border rounded-md px-3 py-1">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{selectedDate}</span>
          </div>
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
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
      
      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Daily Tasks</CardTitle>
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
              {tasks.map((task) => {
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
