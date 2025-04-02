
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { Task } from '@/types';
import { getCurrentUser, hasPermission, recordAttendance } from '@/services/data-service';
import { toast } from 'sonner';

interface TaskCheckInOutProps {
  task: Task;
  onUpdate: (updatedTask: Task) => void;
}

const TaskCheckInOut: React.FC<TaskCheckInOutProps> = ({ task, onUpdate }) => {
  const [isWorking, setIsWorking] = useState(task.status === 'in-progress');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const currentUser = getCurrentUser();
  
  // Check if current user has permission to check in/out for this task
  const canCheckInOut = hasPermission(currentUser, 'tasks', 'manage') || 
    (currentUser.role === 'mechanic' && 
     currentUser.mechanicId === task.mechanicId && 
     hasPermission(currentUser, 'tasks', 'manage'));

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
    const updatedTask = { ...task, status: 'in-progress' as const };
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
      hoursSpent 
    };
    onUpdate(updatedTask);
    
    // Record attendance checkout if current user is a mechanic
    if (currentUser.role === 'mechanic' && currentUser.mechanicId) {
      // Find today's attendance record to update - in a real app you'd use an API call
      toast.success("You've checked out for this task");
    }
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
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-muted-foreground" />
            <span>
              {task.hoursSpent ? `${task.hoursSpent} hours spent` : 'No time logged yet'}
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
              disabled={task.status === 'completed'}
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
