
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Task, Mechanic } from "@/types";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface MechanicPerformanceProps {
  mechanic: Mechanic;
  tasks: Task[];
}

interface PerformanceMetrics {
  taskCompletionRate: number;
  averageEfficiency: number;
  tasksCompleted: number;
  totalTasks: number;
  totalHoursEstimated: number;
  totalHoursSpent: number;
  efficiencyByTaskType: { name: string; efficiency: number; estimated: number; actual: number }[];
  recentTasks: Task[];
}

const MechanicPerformance: React.FC<MechanicPerformanceProps> = ({ mechanic, tasks }) => {
  // Calculate performance metrics
  const calculatePerformanceMetrics = (): PerformanceMetrics => {
    // Filter tasks for this mechanic
    const mechanicTasks = tasks.filter(task => task.mechanicId === mechanic.id);
    const completedTasks = mechanicTasks.filter(task => task.status === 'completed');
    
    // Task completion rate
    const taskCompletionRate = mechanicTasks.length > 0 
      ? Math.round((completedTasks.length / mechanicTasks.length) * 100)
      : 0;
    
    // Hours metrics for completed tasks
    const totalHoursEstimated = completedTasks.reduce((sum, task) => sum + task.hoursEstimated, 0);
    const totalHoursSpent = completedTasks.reduce((sum, task) => sum + (task.hoursSpent || 0), 0);
    
    // Average efficiency (estimated / actual * 100)
    const averageEfficiency = totalHoursSpent > 0 
      ? Math.round((totalHoursEstimated / totalHoursSpent) * 100) 
      : 100;
    
    // Group tasks by title for efficiency by task type
    const taskTypeMap = new Map<string, { estimated: number, actual: number, count: number }>();
    completedTasks.forEach(task => {
      const key = task.title;
      const current = taskTypeMap.get(key) || { estimated: 0, actual: 0, count: 0 };
      taskTypeMap.set(key, {
        estimated: current.estimated + task.hoursEstimated,
        actual: current.actual + (task.hoursSpent || task.hoursEstimated),
        count: current.count + 1
      });
    });
    
    const efficiencyByTaskType = Array.from(taskTypeMap.entries()).map(([name, data]) => {
      const efficiency = data.estimated > 0 
        ? Math.round((data.estimated / data.actual) * 100) 
        : 100;
      return {
        name,
        efficiency,
        estimated: data.estimated,
        actual: data.actual
      };
    });
    
    // Recent tasks (last 5)
    const recentTasks = [...mechanicTasks]
      .sort((a, b) => {
        const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return dateB - dateA; // Sort in descending order (newest first)
      })
      .slice(0, 5);
    
    return {
      taskCompletionRate,
      averageEfficiency,
      tasksCompleted: completedTasks.length,
      totalTasks: mechanicTasks.length,
      totalHoursEstimated,
      totalHoursSpent,
      efficiencyByTaskType,
      recentTasks
    };
  };
  
  const metrics = calculatePerformanceMetrics();
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Performance metrics for {mechanic.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground">Tasks Completed</h3>
              <p className="text-2xl font-bold">{metrics.tasksCompleted}</p>
              <span className="text-xs text-muted-foreground">of {metrics.totalTasks} total tasks</span>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground">Completion Rate</h3>
              <p className="text-2xl font-bold">{metrics.taskCompletionRate}%</p>
              <span className="text-xs text-muted-foreground">task completion rate</span>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground">Overall Efficiency</h3>
              <p className={`text-2xl font-bold ${
                metrics.averageEfficiency >= 90 ? 'text-green-600' :
                metrics.averageEfficiency >= 75 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.averageEfficiency}%
              </p>
              <span className="text-xs text-muted-foreground">estimated vs. actual time</span>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground">Hours Logged</h3>
              <p className="text-2xl font-bold">{metrics.totalHoursSpent.toFixed(1)}</p>
              <span className="text-xs text-muted-foreground">
                vs {metrics.totalHoursEstimated.toFixed(1)} estimated
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Efficiency by Task Type</CardTitle>
          <CardDescription>How efficient is the mechanic at different types of tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.efficiencyByTaskType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis unit="h" />
                <Tooltip formatter={(value, name) => [
                  `${value}${name === 'efficiency' ? '%' : 'h'}`,
                  name === 'efficiency' ? 'Efficiency' : name === 'estimated' ? 'Est. Hours' : 'Actual Hours'
                ]}/>
                <Legend />
                <Bar dataKey="estimated" name="Estimated Hours" fill="#4ade80" />
                <Bar dataKey="actual" name="Actual Hours" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.recentTasks.length > 0 ? metrics.recentTasks.map(task => {
              const efficiency = task.hoursSpent
                ? Math.round((task.hoursEstimated / task.hoursSpent) * 100)
                : null;
                
              return (
                <div key={task.id} className="flex items-start justify-between border-b pb-3">
                  <div>
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-muted-foreground">{task.description.substring(0, 60)}{task.description.length > 60 ? '...' : ''}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{task.hoursSpent || 0} / {task.hoursEstimated} hours</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {efficiency !== null && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                          efficiency >= 90 ? 'bg-green-100 text-green-800' :
                          efficiency >= 75 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {efficiency >= 90 ? <CheckCircle className="h-3 w-3" /> :
                         efficiency < 75 ? <AlertTriangle className="h-3 w-3" /> : null}
                        {efficiency}% efficient
                      </span>
                    )}
                    {task.completedAt && (
                      <span className="text-xs text-muted-foreground mt-1">
                        {new Date(task.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            }) : (
              <p className="text-center py-6 text-muted-foreground">No recent tasks found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MechanicPerformance;
