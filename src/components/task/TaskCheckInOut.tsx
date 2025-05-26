
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { Task } from "@/types";
import { useAuthContext } from "@/context/AuthContext";

interface TaskCheckInOutProps {
  task: Task;
  onTaskUpdate: (task: Task) => void;
}

const TaskCheckInOut = ({ task, onTaskUpdate }: TaskCheckInOutProps) => {
  const { currentUser } = useAuthContext();
  const [isWorking, setIsWorking] = useState(task.status === 'in-progress');

  const handleCheckIn = () => {
    const updatedTask: Task = {
      ...task,
      status: 'in-progress',
      start_time: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    onTaskUpdate(updatedTask);
    setIsWorking(true);
    toast.success("Checked in to task");
  };

  const handleCheckOut = () => {
    const updatedTask: Task = {
      ...task,
      status: 'completed',
      end_time: new Date().toISOString(),
      completed_by: currentUser?.id,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    onTaskUpdate(updatedTask);
    setIsWorking(false);
    toast.success("Checked out of task");
  };

  const canCheckIn = task.status === 'pending' && currentUser?.id === task.mechanic_id;
  const canCheckOut = task.status === 'in-progress' && currentUser?.id === task.mechanic_id;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-4 w-4" />
          Time Tracking
        </CardTitle>
        <CardDescription>
          Check in and out of tasks to track time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {canCheckIn && (
            <Button onClick={handleCheckIn} className="flex-1">
              <Play className="mr-2 h-4 w-4" />
              Check In
            </Button>
          )}
          
          {canCheckOut && (
            <Button onClick={handleCheckOut} variant="destructive" className="flex-1">
              <Square className="mr-2 h-4 w-4" />
              Check Out
            </Button>
          )}
          
          {!canCheckIn && !canCheckOut && (
            <div className="text-sm text-muted-foreground">
              {task.status === 'completed' ? 'Task completed' : 'Not authorized to check in/out'}
            </div>
          )}
        </div>
        
        {task.start_time && (
          <div className="mt-2 text-sm text-muted-foreground">
            Started: {new Date(task.start_time).toLocaleString()}
          </div>
        )}
        
        {task.end_time && (
          <div className="text-sm text-muted-foreground">
            Completed: {new Date(task.end_time).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskCheckInOut;
