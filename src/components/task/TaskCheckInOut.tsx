
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Task } from '@/types';
import { getCurrentUser, hasPermission, recordAttendance } from '@/services/data-service';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface TaskCheckInOutProps {
  task: Task;
  onUpdate: (updatedTask: Task) => void;
}

const TaskCheckInOut: React.FC<TaskCheckInOutProps> = ({ task, onUpdate }) => {
  const [isWorking, setIsWorking] = useState(task.status === 'in-progress');
  const [startTime, setStartTime] = useState<Date | null>(
    task.startTime ? new Date(task.startTime) : null
  );
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [efficiency, setEfficiency] = useState<number>(100);
  const currentUser = getCurrentUser();
  
  // Check if current user has permission to check in/out for this task
  const canCheckInOut = hasPermission(currentUser, 'tasks', 'manage') || 
    (currentUser.role === 'mechanic' && 
     currentUser.mechanicId === task.mechanicId && 
     hasPermission(currentUser, 'tasks', 'manage'));
     
  // Calculate elapsed time and update display
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isWorking && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsedHours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        setElapsedTime(elapsedHours);
        
        // Calculate efficiency (estimated vs actual)
        if (task.hoursEstimated > 0) {
          const currentEfficiency = task.hoursEstimated / Math.max(elapsedHours, 0.01) * 100;
          setEfficiency(Math.min(Math.round(currentEfficiency), 150));
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWorking, startTime, task.hoursEstimated]);

  const handleCheckIn = () => {
    if (!canCheckInOut) {
      toast.error("You don't have permission to check in for this task");
      return;
    }

    // Record attendance
    const now = new Date();
    setStartTime(now);
    setIsWorking(true);
    
    // Update task status
    const updatedTask = { 
      ...task, 
      status: 'in-progress' as const,
      startTime: now.toISOString() 
    };
    onUpdate(updatedTask);
    
    // Record attendance if current user is a mechanic
    if (currentUser.role === 'mechanic' && currentUser.mechanicId) {
      recordAttendance({
        mechanicId: currentUser.mechanicId,
        date: now.toISOString().split('T')[0],
        checkIn: now.toTimeString().split(' ')[0].substring(0, 5),
        status: 'pending'
      });
      toast.success("You've checked in for this task");
    }
  };

  const handleCheckOut = () => {
    if (!canCheckInOut) {
      toast.error("You don't have permission to check out for this task");
      return;
    }

    const now = new Date();
    setIsWorking(false);
    
    // Calculate hours spent
    let hoursSpent = task.hoursSpent || 0;
    if (startTime) {
      const hoursElapsed = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      hoursSpent += parseFloat(hoursElapsed.toFixed(2));
    }
    
    // Update task with new hours spent
    const updatedTask = { 
      ...task, 
      hoursSpent,
      endTime: now.toISOString()
    };
    onUpdate(updatedTask);
    
    // Record attendance checkout if current user is a mechanic
    if (currentUser.role === 'mechanic' && currentUser.mechanicId) {
      // Find today's attendance record to update - in a real app you'd use an API call
      toast.success("You've checked out for this task");
    }
  };

  const getEfficiencyColor = (efficiency: number): string => {
    if (efficiency >= 90) return 'bg-green-500';
    if (efficiency >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // If user doesn't have permission, don't show the component
  if (!hasPermission(currentUser, 'tasks', 'view')) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Task Time Tracking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-muted-foreground" />
            <span>
              {task.hoursSpent ? `${task.hoursSpent.toFixed(2)} hours spent` : 'No time logged yet'}
              {isWorking && ' (Running)'}
            </span>
          </div>
          <div className="flex items-center">
            {task.status === 'completed' ? (
              <span className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                Completed
              </span>
            ) : task.status === 'in-progress' ? (
              <span className="flex items-center text-blue-600">
                <Clock className="w-5 h-5 mr-2" />
                In Progress
              </span>
            ) : (
              <span className="flex items-center text-yellow-600">
                <Clock className="w-5 h-5 mr-2" />
                Pending
              </span>
            )}
          </div>
        </div>

        {isWorking && (
          <>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span>Current session:</span>
                <span className="font-medium">{elapsedTime.toFixed(2)} hours</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Efficiency:</span>
                <span className="font-medium">
                  {efficiency}%
                </span>
              </div>
              
              <Progress 
                value={efficiency} 
                max={150}
                className={getEfficiencyColor(efficiency)}
              />
              
              {efficiency < 75 && (
                <div className="flex items-center text-red-600 text-sm mt-1">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Taking longer than estimated
                </div>
              )}
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Start time: {startTime?.toLocaleTimeString()}</span>
              <span>Estimated: {task.hoursEstimated} hours</span>
            </div>
          </>
        )}
        
        {task.completedAt && (
          <div className="text-sm text-muted-foreground">
            Completed on {new Date(task.completedAt).toLocaleDateString()} at {new Date(task.completedAt).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
      {canCheckInOut && task.status !== 'completed' && (
        <CardFooter className="flex justify-end space-x-2">
          {isWorking ? (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleCheckOut}
              className="flex items-center"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Check Out
            </Button>
          ) : (
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleCheckIn}
              className="flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Check In
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default TaskCheckInOut;
