import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, Download, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { subDays } from "date-fns";
import { useDataContext } from "@/context/data/DataContext";
import { isWithinInterval, parseISO } from "date-fns";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";

const TasksReport = () => {
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const { tasks, mechanics } = useDataContext();
  const { formatCurrency } = useOrganizationSettings();

  // Filter tasks for the selected date range
  const filteredTasks = tasks.filter(task => {
    try {
      const taskDate = parseISO(task.created_at || '');
      return isWithinInterval(taskDate, { start: startDate, end: endDate });
    } catch (e) {
      return false;
    }
  });

  // Calculate statistics
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress').length;
  const pendingTasks = filteredTasks.filter(t => t.status === 'pending').length;

  const totalHoursSpent = filteredTasks.reduce((sum, task) => sum + (task.hoursSpent || 0), 0);
  const totalHoursEstimated = filteredTasks.reduce((sum, task) => sum + (task.hoursEstimated || 0), 0);
  const averageTaskTime = totalTasks > 0 ? totalHoursSpent / totalTasks : 0;
  
  // Calculate financial metrics
  const totalTaskValue = filteredTasks.reduce((sum, task) => sum + (task.price || 0), 0);
  const averageTaskValue = totalTasks > 0 ? totalTaskValue / totalTasks : 0;

  const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

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
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onRangeChange={handleDateRangeChange}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words">{formatCurrency(totalTaskValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words">{formatCurrency(averageTaskValue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Task Details</CardTitle>
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
                <TableHead>Price</TableHead>
                <TableHead>Hours Est.</TableHead>
                <TableHead>Hours Spent</TableHead>
                <TableHead>Efficiency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No tasks found for the selected date range
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => {
                  const mechanic = mechanics.find(m => m.id === task.mechanicId);
                  const efficiency = task.hoursEstimated && task.hoursSpent 
                    ? ((task.hoursEstimated / task.hoursSpent) * 100).toFixed(1) 
                    : 'N/A';

                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{mechanic?.name || "Unassigned"}</TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {task.status}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(task.price || 0)}</TableCell>
                      <TableCell>{task.hoursEstimated || 0}h</TableCell>
                      <TableCell>{task.hoursSpent || 0}h</TableCell>
                      <TableCell>
                        {efficiency !== 'N/A' && (
                          <span className={`font-medium ${
                            parseFloat(efficiency) >= 100 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {efficiency}%
                          </span>
                        )}
                        {efficiency === 'N/A' && <span className="text-muted-foreground">N/A</span>}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TasksReport;
